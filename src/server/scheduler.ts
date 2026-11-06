import { db, get, put, transaction, event } from './store';
import { suppliers } from './service';
import { atomic, DomainError } from '../domain/procurement';
import { executeStandingOrder, standingPreflight } from './agreements';

export function scheduledOrder(agreement:Record<string,any>,now=Date.now()){
 const terms=agreement.terms;
 if(agreement.status!=='active'||agreement.contractStatus!=='verified'||terms?.autoExecute!==true)return undefined;
 const start=Date.parse(terms.startsAt);const expiry=Date.parse(terms.expiresAt);
 if(!Number.isFinite(start)||!Number.isFinite(expiry)||start>now||expiry<=now||!Number.isSafeInteger(terms.frequencySeconds)||terms.frequencySeconds<60)return undefined;
 const supplier=suppliers.find(s=>s.id===agreement.supplierId);
 if(!supplier||!Number.isSafeInteger(terms.reorderQuantity)||terms.reorderQuantity<=0||terms.reorderQuantity>terms.quantity||!/^\d+$/.test(terms.settlementTinybarPerMinor||''))throw new DomainError('The signed recurring order configuration is incomplete.',409);
 const subtotal=atomic(terms.reorderQuantity*supplier.unitPriceMinor,'Scheduled subtotal');
 const totalMinor=atomic(subtotal+Math.ceil(subtotal*terms.feeBps/10000)+terms.deliveryMinor+terms.taxMinor,'Scheduled landed amount');
 const period=Math.floor((now-start)/(terms.frequencySeconds*1000));
 return {item:terms.item,quantity:terms.reorderQuantity,unitPriceMinor:supplier.unitPriceMinor,totalMinor,amountAtomic:(BigInt(totalMinor)*BigInt(terms.settlementTinybarPerMinor)).toString(),payeeAddress:terms.payeeAddress,requestId:`scheduled-${agreement.id}-${period}`,period};
}

export async function runStandingSchedule(options:{execute?:typeof executeStandingOrder;now?:number}={}){
 if(process.env.HEDERA_SPA_EXECUTION_ENABLED!=='true')return false;
 const rows=db().prepare("SELECT tenant,body FROM records WHERE kind='agreement' AND json_extract(body,'$.status')='active'").all() as {tenant:string,body:string}[];
 for(const row of rows){const agreement=JSON.parse(row.body);let order;
  try{order=scheduledOrder(agreement,options.now??Date.now());}catch{continue;}
  if(!order)continue;
  const tickId=`schedule-${agreement.id}-${order.period}`;
  const claimed=transaction(()=>{if(get('schedule_tick',row.tenant,tickId))return false;try{standingPreflight(row.tenant,agreement.id,order);}catch(error){put('schedule_tick',row.tenant,{id:tickId,agreementId:agreement.id,requestId:order.requestId,status:'blocked',reason:error instanceof DomainError?error.message:'Scheduled preflight could not establish authority.'});event(row.tenant,'schedule.blocked','Scheduled order stopped at a deterministic authority or inventory check.',{agreementId:agreement.id});return false;}put('schedule_tick',row.tenant,{id:tickId,agreementId:agreement.id,requestId:order.requestId,status:'running'});return true;});
  if(!claimed)continue;
  try{const {period,...input}=order;const result=await(options.execute??executeStandingOrder)(row.tenant,agreement.id,input);transaction(()=>{put('schedule_tick',row.tenant,{...get('schedule_tick',row.tenant,tickId),id:tickId,status:result.status==='confirmed'?'confirmed':'outcome_pending',executionId:result.id});event(row.tenant,'schedule.executed','Scheduled standing order processed under previously signed authority.',{agreementId:agreement.id,executionId:result.id});});}
  catch{transaction(()=>{put('schedule_tick',row.tenant,{...get('schedule_tick',row.tenant,tickId),id:tickId,status:'outcome_unknown'});event(row.tenant,'schedule.uncertain','Scheduled execution outcome needs reconciliation; this period will not be submitted again.',{agreementId:agreement.id});});}
  return true;
 }
 return false;
}
