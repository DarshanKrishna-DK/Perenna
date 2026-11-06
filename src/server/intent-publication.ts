import { DomainError, digest } from '../domain/procurement';
import {publicRequestCommitment} from '../domain/public-request';
import { assertIntentOpen, required, settings } from './service';
import { event, put, transaction } from './store';
import {z} from 'zod';

export function intentPublicationProjection(tenant:string,intent:Record<string,any>){return publicRequestCommitment(tenant,intent,settings(tenant).policyVersion);}
export function assertCurrentPublication(tenant:string,intent:Record<string,any>,projection:ReturnType<typeof intentPublicationProjection>){assertIntentOpen(tenant,intent.id,projection.requestVersion);if(digest(intentPublicationProjection(tenant,required('intent',tenant,intent.id)))!==digest(projection))throw new DomainError('Request or policy changed during publication preparation.',409);}
function privatePublicationReview(tenant:string,intent:Record<string,any>){
 const policy=settings(tenant);
 return {item:intent.item,quantity:intent.quantity,unit:intent.unit,specification:intent.specification||'',budgetMinor:intent.budgetMinor,currency:intent.currency||'INR',deliveryAddress:intent.deliveryAddress||'',contact:intent.contact||'',qualityRequirements:intent.qualityRequirements||'',substitutionPolicy:intent.substitutionPolicy||'none',hardCriteria:intent.hardCriteria||[],preferredCriteria:intent.preferredCriteria||[],procurementPerOrderCapMinor:policy.procurementPerOrderCapMinor,procurementSessionCapMinor:policy.procurementSessionCapMinor,procurementDailyCapMinor:policy.procurementDailyCapMinor,policyVersion:policy.policyVersion};
}
export async function publishReviewedIntent(tenant:string,id:string,input:unknown,actorId:string){
 const consent=z.object({expectedVersion:z.number().int().positive(),confirmPublic:z.literal(true),projectionDigest:z.string().regex(/^[0-9a-f]{64}$/)}).strict().parse(input);
 if(typeof actorId!=='string'||!actorId)throw new DomainError('Authenticated publication identity is required.',403);
 const intent=assertIntentOpen(tenant,id,consent.expectedVersion),projection=intentPublicationProjection(tenant,intent);
 if(digest(projection)!==consent.projectionDigest||!intent.publicationPreparation?.projection||digest(intent.publicationPreparation.projection)!==consent.projectionDigest)throw new DomainError('The request or policy changed. Review the exact public projection again before publication.',409);
 transaction(()=>{assertCurrentPublication(tenant,intent,projection);put('publication_consent',tenant,{intentId:id,actorId,requestVersion:consent.expectedVersion,policyVersion:projection.policyVersion,projectionDigest:consent.projectionDigest,confirmedAt:new Date().toISOString()});});
 return publishPublicIntent(tenant,id,consent.expectedVersion);
}
export async function preparePublicIntent(tenant:string,id:string,expectedVersion:number){const intent=assertIntentOpen(tenant,id,expectedVersion);const projection=intentPublicationProjection(tenant,intent);const {prepareIntentPublication}=await import('../providers/arkiv');const result=await prepareIntentPublication(projection);transaction(()=>{assertCurrentPublication(tenant,intent,projection);const current=required('intent',tenant,id);put('intent',tenant,{...current,publicationPreparation:{projection,preparedAt:new Date().toISOString(),signed:false,submitted:false,snapshotOnly:true}});});return {...result,publicProjection:projection,projectionDigest:digest(projection),privateReview:privatePublicationReview(tenant,intent)};}
export async function publishPublicIntent(tenant:string,id:string,expectedVersion:number){
 const existing=required('intent',tenant,id);if(existing.publicationStatus==='unknown')return reconcilePublicIntent(tenant,id);
 const intent=assertIntentOpen(tenant,id,expectedVersion);const projection=intentPublicationProjection(tenant,intent);
 if(intent.publicationStatus==='confirmed'&&intent.arkiv?.projection&&digest(intent.arkiv.projection)===digest(projection))return intent;
 if(['publishing','unknown'].includes(intent.publicationStatus))throw new DomainError('Prior publication outcome needs reconciliation. Do not sign another write.',409);
 const cap=process.env.ARKIV_MAX_FEE_WEI;if(!cap||!/^\d+$/.test(cap)||BigInt(cap)<=0n)throw new DomainError('An authorized maximum write fee must be configured before publication.',409);
 const preparedAt=new Date().toISOString();const alreadyPublished=transaction(()=>{assertCurrentPublication(tenant,intent,projection);const current=required('intent',tenant,id);if(['publishing','unknown'].includes(current.publicationStatus))throw new DomainError('Publication already claimed. Reconcile before another write.',409);if(current.publicationStatus==='confirmed'&&current.arkiv?.projection&&digest(current.arkiv.projection)===digest(projection))return current;put('intent',tenant,{...current,publicationStatus:'publishing',pendingPublication:{projection,preparedAt}});return undefined;});if(alreadyPublished)return alreadyPublished;
 try{const {publishIntent}=await import('../providers/arkiv');const result=await publishIntent(projection,{maxFeeWei:BigInt(cap)});return transaction(()=>{const current=required('intent',tenant,id);let isCurrent=true;try{assertCurrentPublication(tenant,current,projection);}catch{isCurrent=false;}const metadata={entityKey:result.entityKey,transactionHash:result.transactionHash,writer:result.writer,expiresAtBlock:result.expiresAtBlock,projection,preparedAt,requestVersion:projection.requestVersion,policyVersion:projection.policyVersion};put('intent_publication',tenant,{intentId:id,projection,arkiv:metadata,status:isCurrent?'confirmed':'stale'});const {pendingPublication,...fields}=current;const updated=put('intent',tenant,{...fields,publicationStatus:isCurrent?'confirmed':'stale',arkiv:metadata,publicationHistory:[...(current.publicationHistory||[]),...(current.arkiv?[current.arkiv]:[])]});event(tenant,isCurrent?'intent.published':'intent.publication_stale',isCurrent?'The exact versioned public request was confirmed and read back on Arkiv.':'A prior request snapshot reached Arkiv. Current request or policy changed, so discovery remains blocked.',{intentId:id,entityKey:result.entityKey});return updated;});}
 catch(error){transaction(()=>{const current=required('intent',tenant,id);put('intent',tenant,{...current,publicationStatus:'unknown'});});throw error;}
}

export async function reconcilePublicIntent(tenant:string,id:string){
 const intent=required('intent',tenant,id);const frozen=intent.pendingPublication||intent.arkiv;
 if(!frozen?.projection)throw new DomainError('No frozen publication is available for reconciliation.',409);
 const projection=frozen.projection;const fingerprint=digest(projection);const {reconcileIntentPublication}=await import('../providers/arkiv');const outcome=await reconcileIntentPublication(projection);
 return transaction(()=>{const current=required('intent',tenant,id);const pending=current.pendingPublication||current.arkiv;if(!pending?.projection||digest(pending.projection)!==fingerprint)throw new DomainError('The publication recovery scope changed.',409);
  if(outcome.status!=='confirmed'){const updated=put('intent',tenant,{...current,publicationStatus:outcome.status==='not_submitted'?'not_published':outcome.status==='reverted'?'reverted':'unknown',publicationRecovery:{status:outcome.status,checkedAt:new Date().toISOString(),transactionHash:outcome.transactionHash}});return updated;}
  let isCurrent=!outcome.expired&&projection.requestExpiresMs>Date.now();try{assertCurrentPublication(tenant,current,projection);}catch{isCurrent=false;}
  const metadata={entityKey:outcome.entityKey,transactionHash:outcome.transactionHash,writer:outcome.writer,expiresAtBlock:outcome.expiresAtBlock,projection,preparedAt:frozen.preparedAt,requestVersion:projection.requestVersion,policyVersion:projection.policyVersion};const status=outcome.expired||projection.requestExpiresMs<=Date.now()?'expired':isCurrent?'confirmed':'stale';
  const {pendingPublication,...fields}=current;const updated=put('intent',tenant,{...fields,publicationStatus:status,arkiv:metadata,publicationRecovery:{status:'confirmed',expired:!!outcome.expired,checkedAt:new Date().toISOString()}});
  put('intent_publication',tenant,{id:'publication-'+id+'-'+digest(projection),intentId:id,projection,arkiv:metadata,status});return updated;
 });
}
