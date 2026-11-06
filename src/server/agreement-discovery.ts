import {isAddress, type Address} from 'viem';
import {z} from 'zod';
import {digest, DomainError} from '../domain/procurement';
import {normalizeCity, normalizeItem, normalizeUnit} from '../domain/normalization';
import {discoverAgreementIndexes, parseAgreementDiscovery, prepareAgreementDiscovery, publishAgreementDiscovery, reconcileAgreementDiscovery, type PublicAgreementDiscovery} from '../providers/arkiv-agreements';
import {event, list, put, transaction} from './store';
import {required} from './service';

const identity=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function indexStatus(agreement:Record<string,any>):PublicAgreementDiscovery['indexStatus']{
  if(agreement.replacementAgreementId||agreement.status==='revoked'||Date.parse(agreement.terms?.expiresAt)<=Date.now())return 'closed';
  if(['paused','disputed'].includes(agreement.status))return 'paused';
  if(agreement.status==='active'&&agreement.contractStatus==='verified'&&agreement.createTransactionHash&&agreement.buyerSignature&&agreement.supplierSignature)return 'active';
  return 'proposed';
}
export function agreementDiscoveryProjection(tenant:string,id:string):PublicAgreementDiscovery {
  if(!identity.test(tenant))throw new DomainError('A private high-entropy business identity is required for public discovery.',409);
  const agreement=required('agreement',tenant,id),terms=agreement.terms;
  if(!terms||agreement.hash!=='0x'+digest(terms))throw new DomainError('Only a frozen standing agreement can be indexed.',409);
  const fields={agreementCommitment:'0x'+digest({domain:'perenna.agreement-discovery.id.v1',businessId:tenant,agreementId:id}),businessCommitment:'0x'+digest({domain:'perenna.business.commitment.v2',businessId:tenant}),termsCommitment:agreement.hash,item:normalizeItem(terms.item),unit:normalizeUnit(terms.unit),area:normalizeCity(terms.location),indexStatus:indexStatus(agreement),agreementVersion:agreement.version,startsMs:Date.parse(terms.startsAt),expiresMs:Date.parse(terms.expiresAt),createdMs:Date.parse(agreement.createdAt)};
  const prior=agreement.discovery?.projection as PublicAgreementDiscovery|undefined;
  const indexVersion=prior?.indexVersion||0;
  const same=prior&&digest({...prior,indexVersion:0})===digest({...fields,indexVersion:0});
  return parseAgreementDiscovery({...fields,indexVersion:same?indexVersion:indexVersion+1});
}
function assertCurrent(tenant:string,id:string,projection:PublicAgreementDiscovery){
  if(digest(agreementDiscoveryProjection(tenant,id))!==digest(projection))throw new DomainError('Agreement status or frozen terms changed. Review the new discovery projection.',409);
}
export async function prepareStandingDiscovery(tenant:string,id:string){
  const projection=agreementDiscoveryProjection(tenant,id);
  const result=await prepareAgreementDiscovery(projection);
  transaction(()=>{assertCurrent(tenant,id,projection);const current=required('agreement',tenant,id);put('agreement',tenant,{...current,discoveryPreparation:{projection,projectionDigest:digest(projection),preparedAt:new Date().toISOString(),signed:false,submitted:false}});});
  return {...result,projectionDigest:digest(projection),publicProjection:projection};
}
export async function publishStandingDiscovery(tenant:string,id:string,input:unknown){
  const consent=z.object({confirmPublicDiscovery:z.literal(true),projectionDigest:z.string().regex(/^[0-9a-f]{64}$/)}).strict().parse(input);
  const projection=agreementDiscoveryProjection(tenant,id),current=required('agreement',tenant,id);
  if(digest(projection)!==consent.projectionDigest||current.discoveryPreparation?.projectionDigest!==consent.projectionDigest)throw new DomainError('Review the exact unsigned discovery projection before publication.',409);
  if(current.discovery?.status==='confirmed'&&digest(current.discovery.projection)===consent.projectionDigest)return current.discovery;
  if(['publishing','unknown'].includes(current.discovery?.status))throw new DomainError('Reconcile the original discovery transaction before another publication.',409);
  const fee=process.env.ARKIV_MAX_FEE_WEI;
  if(!fee||!/^\d+$/.test(fee)||BigInt(fee)<=0n)throw new DomainError('An explicit authorized Arkiv write cap is required.',409);
  transaction(()=>{assertCurrent(tenant,id,projection);const value=required('agreement',tenant,id);if(['publishing','unknown'].includes(value.discovery?.status))throw new DomainError('Discovery publication is already claimed.',409);put('agreement',tenant,{...value,discovery:{status:'publishing',projection}});});
  try {
    const result=await publishAgreementDiscovery(projection,{maxFeeWei:BigInt(fee)});
    return transaction(()=>{const value=required('agreement',tenant,id);let valid=true;try{assertCurrent(tenant,id,projection);}catch{valid=false;}const discovery={...result,projection,status:valid?'confirmed':'stale'};put('agreement',tenant,{...value,discovery});event(tenant,'agreement.discovery_published','The reviewed coarse agreement index was confirmed on Arkiv. Discovery does not authorize payment.',{agreementId:id,entityKey:result.entityKey});return discovery;});
  }catch(error){transaction(()=>{const value=required('agreement',tenant,id);put('agreement',tenant,{...value,discovery:{...value.discovery,status:'unknown'}});});throw error;}
}
export async function discoverStandingAgreements(tenant:string,area:unknown){
  const city=normalizeCity(z.string().parse(area)),writer=process.env.ARKIV_WRITER_ADDRESS;
  if(!writer||!isAddress(writer))throw new DomainError('The public Arkiv publisher is not configured.',409);
  const result=await discoverAgreementIndexes(writer as Address,city);
  const own=new Map(list('agreement',tenant).flatMap(agreement=>{try{const projection=agreementDiscoveryProjection(tenant,agreement.id);return [[projection.agreementCommitment,projection] as const];}catch{return [];} }));
  const entities=result.entities.filter(row=>{const local=own.get(row.agreementCommitment);return !local||digest(local)===digest(Object.fromEntries(Object.keys(local).map(key=>[key,row[key as keyof typeof row]])));});
  transaction(()=>put('agreement_discovery_query',tenant,{area:city,entities,observedBlock:result.observedBlock,truncated:result.truncated,queriedAt:new Date().toISOString(),provenance:'arkiv_current_publisher_query'}));
  return {...result,entities};
}
export async function reconcileStandingDiscovery(tenant:string,id:string){
  const agreement=required('agreement',tenant,id),projection=agreement.discovery?.projection;
  if(!projection)throw new DomainError('There is no original public discovery operation to reconcile.',409);
  const outcome=await reconcileAgreementDiscovery(projection);
  return transaction(()=>{const current=required('agreement',tenant,id);if(digest(current.discovery?.projection)!==digest(projection))throw new DomainError('The discovery journal changed during reconciliation.',409);let fresh=false;try{fresh=digest(agreementDiscoveryProjection(tenant,id))===digest(projection);}catch{/* Expired indexes remain historical records. */}
    const status=outcome.status==='confirmed'?(outcome.expired?'expired':fresh?'confirmed':'stale'):outcome.status==='not_submitted'?'not_published':outcome.status==='reverted'?'reverted':'unknown';
    const discovery={...current.discovery,...outcome,status};put('agreement',tenant,{...current,discovery});event(tenant,'agreement.discovery_reconciled','The original public discovery transaction was checked without signing or resubmitting.',{agreementId:id,status});return discovery;});
}
