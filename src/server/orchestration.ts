import { digest, DomainError } from '../domain/procurement';
import { refreshArkivDiscovery } from './discovery';
import { allInternal, list } from './store';
import { assertIntentOpen, screenedSuppliers, settings } from './service';
import { executeServicePurchase, reserveServicePurchase, type ServiceHttpContext } from './service-payments';
import { queueNegotiation } from './jobs';

export async function startNegotiation(tenant:string,id:string,context:ServiceHttpContext){
 const intent=assertIntentOpen(tenant,id);
 const price=process.env.HEDERA_CAPACITY_PRICE_TINYBAR;
 const policies=list('operating_policy',tenant).filter(policy=>policy.autoAssessForNegotiation===true&&policy.status==='active'&&policy.expiresAt>Date.now()).sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
 const policy=policies.find(policy=>{if(!price||!/^\d+$/.test(price)||BigInt(price)<=0n||BigInt(price)>BigInt(policy.perCallCapAtomic))return false;const spent=list('service_payment',tenant).filter(p=>p.policyId===policy.id&&!['rejected','cancelled'].includes(p.status)).reduce((sum,p)=>sum+BigInt(p.amountAtomic),0n);return spent+BigInt(price)<=BigInt(policy.totalCapAtomic);});
 if(policy){
  if(list('order',tenant).some(order=>order.intentId===id&&order.status!=='cancelled')||intent.status==='negotiating'||settings(tenant).inferenceReserved>=1)throw new DomainError('Request authority is already committed.',409);
  await refreshArkivDiscovery(tenant,id);assertIntentOpen(tenant,id,intent.version);
  const eligible=screenedSuppliers(tenant,id).filter(s=>s.eligible).sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
  const allowance=Number(process.env.INFERENCE_MAX_CALLS||0);const used=allInternal('usage').filter(entry=>entry.provider!=='Sarvam').length;
  if(process.env.INFERENCE_ENABLED!=='true'||!Number.isSafeInteger(allowance)||eligible.length<2||allowance-used<eligible.length*2+1)throw new DomainError('Sufficient authorized inference allowance and eligible suppliers are required before automatic assessment.',409);
  if(new URL(policy.resourceBaseUrl).origin!==context.origin)throw new DomainError('The signed service endpoint must match this application.',409);
  const requestId='auto-'+digest({intentId:id,intentVersion:intent.version,policyId:policy.id,policyVersion:policy.version});
  const purchase=reserveServicePurchase(tenant,policy.id,{requestId,supplierId:eligible[0].id,intentId:id,amountAtomic:price});
  if(purchase.status!=='confirmed')await executeServicePurchase(tenant,purchase.id,context);
  assertIntentOpen(tenant,id,intent.version);
 }
 return queueNegotiation(tenant,id);
}
