import {z} from 'zod';
import {digest, DomainError} from '../domain/procurement';
import {isProviderError} from '../providers/config';
import {negotiatePrivateOffer} from '../providers/private-inference';
import {event, get, list, put, transaction} from './store';
import {assertIntentOpen, buyerCredibility, recordQuoteRevision, required, screenedSuppliers, settings, usageControls} from './service';

const requestSchema=z.object({supplierId:z.string().min(1).max(120),requestId:z.string().min(8).max(100)}).strict();
type Context={userId:string;sessionId?:string};
type PrivateReplyResult={id:string;status:'completed';intentId:string;supplierId:string;quoteId:string;messageId:string;provider:string;providerRequestId:string;quote:Record<string,any>};
function replyView(job:Record<string,any>,quote:Record<string,any>):PrivateReplyResult{return {id:job.id,status:'completed',intentId:job.intentId,supplierId:job.supplierId,quoteId:job.quoteId,messageId:job.messageId,provider:job.provider,providerRequestId:job.providerRequestId,quote};}

export async function requestPrivateAgentReply(tenant:string,intentId:string,input:unknown,context:Context):Promise<PrivateReplyResult>{
  const request=requestSchema.parse(input);
  const jobId='private-'+digest({tenant,intentId,requestId:request.requestId});
  const prior=get('private_negotiation',tenant,jobId);
  if(prior){
    if(prior.supplierId!==request.supplierId)throw new DomainError('This request identifier belongs to another private room.',409);
    if(prior.status==='completed')return replyView(prior,required('quote',tenant,prior.quoteId));
    throw new DomainError('The previous private request needs review before another model call. Its result has not been replayed.',409);
  }
  const roomId=intentId+'-'+request.supplierId;
  const prepared=transaction(()=>{
    const intent=assertIntentOpen(tenant,intentId);
    const policy=settings(tenant);
    if(intent.status==='negotiating'||policy.inferenceReserved>=1)throw new DomainError('Another negotiation is using this business allowance.',409);
    if(list('order',tenant).some(order=>order.intentId===intentId&&order.status!=='cancelled'))throw new DomainError('Review or withdraw the existing order before requesting changed commercial terms.',409);
    const supplier=screenedSuppliers(tenant,intentId).find(candidate=>candidate.id===request.supplierId&&candidate.eligible);
    if(!supplier)throw new DomainError('This supplier is not currently admitted to this request.',403);
    const conversation=list('message',tenant).filter(message=>message.intentId===intentId&&message.roomId===roomId&&message.supplierId===request.supplierId&&message.visibility==='private').slice(0,20).reverse().map(message=>({actor:String(message.actor),text:String(message.text)}));
    if(!conversation.length)throw new DomainError('Send a private message before requesting a supplier reply.');
    const ownOffer=list('quote',tenant).filter(quote=>quote.intentId===intentId&&quote.supplierId===request.supplierId).sort((a,b)=>(b.version??0)-(a.version??0))[0];
    put('private_negotiation',tenant,{id:jobId,intentId,supplierId:request.supplierId,roomId,requestId:request.requestId,requestedBy:context.userId,status:'running',phase:'prepared',intentVersion:intent.version,policyVersion:policy.policyVersion,previousIntentStatus:intent.status});
    put('settings',tenant,{...policy,inferenceReserved:policy.inferenceReserved+1,inferenceOwnerId:jobId});
    put('intent',tenant,{...intent,status:'negotiating',privateJobId:jobId});
    event(tenant,'private.started','A supplier agent is reviewing its private conversation.',{intentId,supplierId:request.supplierId});
    return {intent,policy,supplier,conversation,ownOffer};
  });
  const assertCurrent=()=>{
    const current=assertIntentOpen(tenant,intentId,prepared.intent.version);
    if(current.privateJobId!==jobId||settings(tenant).policyVersion!==prepared.policy.policyVersion)throw new DomainError('Request or policy authority changed during the private reply.',409);
    return current;
  };
  try{
    const budget=usageControls(tenant);
    const result=await negotiatePrivateOffer({intent:prepared.intent,supplier:prepared.supplier,ownOffer:prepared.ownOffer?.terms?{...prepared.ownOffer.terms,version:prepared.ownOffer.version}:prepared.ownOffer,buyerEvidence:buyerCredibility(tenant),conversation:prepared.conversation},{
      reserve:async(provider,operation)=>{assertCurrent();const reservation=await budget.reserve(provider,operation);transaction(()=>put('private_negotiation',tenant,{...required('private_negotiation',tenant,jobId),phase:'provider_requested',provider}));return reservation;},
      onUsage:async(details)=>{transaction(()=>put('private_negotiation',tenant,{...required('private_negotiation',tenant,jobId),phase:'response_received',provider:details.provider,providerRequestId:details.requestId,model:details.model,usage:details.usage}));},
    });
    assertCurrent();
    const quote=await recordQuoteRevision(tenant,intentId,request.supplierId,{unitPriceMinor:result.terms.unitPriceMinor,deliveryDays:result.terms.deliveryDays},{provider:result.provider,requestIds:[result.requestId],visibility:'private',roomId});
    return transaction(()=>{
      assertCurrent();
      const text=`Private offer: INR ${(result.terms.unitPriceMinor/100).toFixed(2)} per ${prepared.intent.unit}; delivery in ${result.terms.deliveryDays} ${result.terms.deliveryDays===1?'day':'days'}. Review the structured quote before approval.`;
      const message=put('message',tenant,{intentId,roomId,supplierId:request.supplierId,actor:prepared.supplier.name,text,visibility:'private',provider:result.provider,requestId:result.requestId,quoteId:quote.id,renderedFromStructuredTerms:true});
      const job=put('private_negotiation',tenant,{...required('private_negotiation',tenant,jobId),status:'completed',phase:'quote_recorded',quoteId:quote.id,messageId:message.id,provider:result.provider,providerRequestId:result.requestId});
      event(tenant,'private.replied','A private supplier offer was recorded with its provider request reference.',{intentId,supplierId:request.supplierId,quoteId:quote.id});
      return replyView(job,quote);
    });
  }catch(error){
    transaction(()=>{const current=required('private_negotiation',tenant,jobId);put('private_negotiation',tenant,{...current,status:current.phase==='provider_requested'?'outcome_unknown':'blocked',error:error instanceof DomainError||isProviderError(error)?error.message:'Private negotiation stopped without a verified offer.'});event(tenant,'private.paused','The private reply did not produce an authorized offer. Review usage before retrying.',{intentId,supplierId:request.supplierId});});
    throw error;
  }finally{
    transaction(()=>{const policy=settings(tenant);if(policy.inferenceOwnerId===jobId){const {inferenceOwnerId,...fields}=policy;put('settings',tenant,{...fields,inferenceReserved:Math.max(0,policy.inferenceReserved-1)});}const intent=required('intent',tenant,intentId);if(intent.privateJobId===jobId){const {privateJobId,...fields}=intent;put('intent',tenant,{...fields,...(intent.status==='negotiating'?{status:get('private_negotiation',tenant,jobId)?.status==='completed'?'awaiting_approval':prepared.intent.status}:{})});}});
  }
}
