import {committedSupplierStock} from './catalogue';
import { networkCharges } from '../providers/funds';
import { reserveAuthority, settleAuthority, releaseAuthority } from './budgets';
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { verifyMessage, type Address, type Hex } from "viem";
import type { PaymentPayload, PaymentRequirements } from "@x402/core/types";
import { DomainError, digest } from "../domain/procurement";
import { facilitatorCapabilities, preparePaidRequest, reconcileHederaTransaction, settleProtectedRequest, signedTransactionId, type PaymentPolicy } from "../providers/hedera";
import { allInternal, event, get, list, put, transaction } from "./store";
import { isProviderError } from "../providers/config";
import { required, getSuppliers, assertIntentOpen, settings } from "./service";
import { assertSharedAllowance } from "./exposure";

const atomic = z.string().regex(/^[1-9]\d*$/).max(24);
const policySchema = z.object({domain:z.literal("perenna.operating-policy.testnet.v1"),id:z.string().uuid(),tenant:z.string().min(1),version:z.number().int().positive(),payer:z.string().regex(/^0\.0\.\d+$/),merchant:z.string().regex(/^0\.0\.\d+$/),network:z.literal("hedera:testnet"),asset:z.literal("0.0.0"),resourceBaseUrl:z.string().url(),purpose:z.literal("supplier-capacity-assessment"),perCallCapAtomic:atomic,totalCapAtomic:atomic,autoAssessForNegotiation:z.boolean().optional(),maxNetworkFeeAtomic:z.string().regex(/^\d+$/).optional(),maxTransactionFeeAtomic:atomic.optional(),networkFeePayer:z.literal('facilitator').optional(),facilitator:z.literal('https://x402.org/facilitator').optional(),expiresAt:z.number().int().positive()}).strict();
const requestSchema = z.object({requestId:z.string().min(8).max(100),supplierId:z.string().min(1),intentId:z.string().min(1),amountAtomic:atomic}).strict();
export type OperatingPolicy = z.infer<typeof policySchema>;
export function operatingPolicyMessage(policy:OperatingPolicy) {return JSON.stringify(Object.fromEntries(Object.entries(policySchema.parse(policy)).sort(([a],[b])=>a.localeCompare(b))));}
export function operatingPolicyStatus(tenant:string) {return {policies:list("operating_policy",tenant).map(({signature,...policy})=>policy),purchases:list("service_payment",tenant).map(({payload,...purchase})=>purchase)};}

export async function authorizeOperatingPolicy(tenant:string,input:unknown,signature:Hex,sessionId='local-session') {
 const policy = policySchema.parse(input);if(policy.maxNetworkFeeAtomic===undefined||!policy.maxTransactionFeeAtomic||policy.networkFeePayer!=='facilitator'||policy.facilitator!=='https://x402.org/facilitator')throw new DomainError('New operating authority requires explicit user and facilitator network-fee bounds.',409);
 if(policy.payer!==process.env.HEDERA_OPERATING_ACCOUNT_ID||policy.payer===process.env.HEDERA_ACCOUNT_ID)throw new DomainError("The signed policy must use the separate configured operating payer.",409);
 if(policy.tenant!==tenant||policy.expiresAt<=Date.now()||policy.expiresAt>Date.now()+7*86400000||BigInt(policy.perCallCapAtomic)>BigInt(policy.totalCapAtomic))throw new DomainError("Operating policy tenant, expiry or caps are invalid.",409);
 const base=new URL(policy.resourceBaseUrl);
 if(base.username||base.password||base.search||base.hash||!base.pathname.endsWith("/api/services/capacity/"))throw new DomainError("Use the exact capacity service base URL.",409);
 if(base.protocol!=="https:"&&!(base.protocol==="http:"&&["localhost","127.0.0.1","[::1]"].includes(base.hostname)))throw new DomainError("A secure or loopback service endpoint is required.",409);
 const signer=process.env.HEDERA_SERVICE_POLICY_SIGNER;
 if(!signer||!/^0x[a-fA-F0-9]{40}$/.test(signer))throw new DomainError("Configure the owner-authorized operating-policy signer address first.",409);
 if(!await verifyMessage({address:signer as Address,message:operatingPolicyMessage(policy),signature}))throw new DomainError("The operating policy signature is invalid.",403);
 return transaction(()=>{
  const prior=get("operating_policy",tenant,policy.id);
  if(prior)throw new DomainError("Policy identifiers are immutable. Sign a new policy for any change.",409);
  const saved=put("operating_policy",tenant,{...policy,signature,signer,sessionId,businessPolicyVersion:settings(tenant).policyVersion,status:"active",policyHash:digest(policy)});
  event(tenant,"service.policy_authorized","A bounded service-spending policy was signed.",{policyId:policy.id});
  const {signature:_,...publicPolicy}=saved;return publicPolicy;
 });
}
export function revokeOperatingPolicy(tenant:string,id:string) {return transaction(()=>{const policy=required("operating_policy",tenant,id);put("operating_policy",tenant,{...policy,status:"revoked",revokedAt:new Date().toISOString()});event(tenant,"service.policy_revoked","Future service purchases under this policy are paused.",{policyId:id});return {id,status:"revoked"};});}

function activePolicy(tenant:string,id:string) {const policy=required("operating_policy",tenant,id);if(policy.status!=="active"||policy.expiresAt<=Date.now()||policy.businessPolicyVersion!==undefined&&policy.businessPolicyVersion!==settings(tenant).policyVersion)throw new DomainError("The operating policy is revoked or expired.",409);return policy;}
function safePurchase(purchase:Record<string,any>){const {payload,...safe}=purchase;return safe;}
function claimTransaction(tenant:string,id:string,transactionId:string){
 const other=[...allInternal("payment"),...allInternal("service_payment"),...allInternal("fee_payment"),...allInternal("agreement_execution")].find(p=>p.transactionId===transactionId&&p.id!==id);
 if(other)throw new DomainError("This transaction is already bound to another purchase.",409);
 const claimed=get("service_transaction_claim","network",transactionId);
 if(claimed&&(claimed.purchaseId!==id||claimed.businessId!==tenant))throw new DomainError("This transaction cannot authorize another resource.",409);
 if(!claimed)put("service_transaction_claim","network",{id:transactionId,purchaseId:id,businessId:tenant});
}
export function reserveServicePurchase(tenant:string,policyId:string,input:unknown) {
 const request=requestSchema.parse(input);
 return transaction(()=>{
  const policy=activePolicy(tenant,policyId);
  const declaredPrice=process.env.HEDERA_CAPACITY_PRICE_TINYBAR;
  if(!declaredPrice||!/^\d+$/.test(declaredPrice)||BigInt(declaredPrice)<=0n||request.amountAtomic!==declaredPrice)throw new DomainError("The assessment amount must match the configured merchant price.",409);
  const existing=list("service_payment",tenant).find(p=>p.requestId===request.requestId);
  if(existing){if(existing.requestDigest!==digest({...request,policyId}))throw new DomainError("The idempotency key is already bound to another request.",409);return safePurchase(existing);}
  if(BigInt(request.amountAtomic)>BigInt(policy.perCallCapAtomic))throw new DomainError("The service price exceeds the signed per-call cap.",409);
  const pending=list("service_payment",tenant).filter(p=>p.policyId===policyId&&!['rejected','cancelled'].includes(p.status));
  if(pending.reduce((sum,p)=>sum+BigInt(p.amountAtomic),0n)+BigInt(request.amountAtomic)>BigInt(policy.totalCapAtomic))throw new DomainError("The signed cumulative service cap is exhausted.",409);
  assertSharedAllowance(request.amountAtomic);
  const intent=assertIntentOpen(tenant,request.intentId);const supplier=getSuppliers().find(s=>s.id===request.supplierId);
  if(!supplier)throw new DomainError("The selected supplier is unknown.",404);
  const id=randomUUID();reserveAuthority(tenant,id+'-operating-authority','operating',request.amountAtomic,policy.sessionId||'local-session',settings(tenant));
  const purchase=put("service_payment",tenant,{...request,id,policyId,intentVersion:intent.version,policyHash:policy.policyHash,requestDigest:digest({...request,policyId}),resourceUrl:policy.resourceBaseUrl+id,status:"reserved",attempt:1,authorityReservationId:id+"-operating-authority",payer:policy.payer,asset:policy.asset,network:policy.network,payee:policy.merchant,input:{supplierId:supplier.id,intentId:intent.id,quantity:intent.quantity,location:intent.location,stock:supplier.stock,leadDays:supplier.leadDays,serviceArea:supplier.location},provenance:"sample_inventory_assessment"});
  event(tenant,"service.reserved","Operating allowance reserved for a capacity assessment.",{purchaseId:id,policyId});return safePurchase(purchase);
 });
}

export async function serviceChallenge(tenant:string,id:string){
 const purchase=required("service_payment",tenant,id);const policy=activePolicy(tenant,purchase.policyId);
 if(policy.policyHash!==purchase.policyHash)throw new DomainError("The signed service policy changed.",409);
 const capabilities=await facilitatorCapabilities();const kind=capabilities.kinds.find(k=>k.network==="hedera:testnet"&&k.scheme==="exact"&&k.x402Version===2);
 const feePayer=kind?.extra?.feePayer;if(typeof feePayer!=="string")throw new DomainError("The facilitator does not advertise Hedera testnet.",503);
 const requirements:PaymentRequirements={scheme:"exact",network:"hedera:testnet",asset:purchase.asset,amount:purchase.amountAtomic,payTo:purchase.payee,maxTimeoutSeconds:180,extra:{feePayer}};
 const challenge={x402Version:2,resource:{url:purchase.resourceUrl,description:"Supplier capacity and lead-time assessment",mimeType:"application/json"},accepts:[requirements]};
 return {requirements,challenge};
}
function paymentPolicy(tenant:string,purchase:Record<string,any>):PaymentPolicy{if(purchase.requestId?.startsWith('auto-'))assertIntentOpen(tenant,purchase.intentId,purchase.intentVersion);const policy=activePolicy(tenant,purchase.policyId);if(policy.policyHash!==purchase.policyHash)throw new DomainError("Service authority no longer matches.",409);return {payer:purchase.payer,payee:purchase.payee,asset:purchase.asset,maxAmount:purchase.amountAtomic,expiresAt:policy.expiresAt,resourceUrl:purchase.resourceUrl,maxNetworkFeeAtomic:policy.maxNetworkFeeAtomic,maxTransactionFeeAtomic:policy.maxTransactionFeeAtomic,networkFeePayer:policy.networkFeePayer,facilitator:policy.facilitator,policyVersion:String(policy.version)};}

export type ServiceHttpContext = {origin:string;cookie:string};
function provenUnsignedService(purchase:Record<string,any>){return purchase.status==="not_submitted"&&!purchase.transactionId&&!purchase.payload&&!purchase.signingStartedAt&&(purchase.attempts??[]).every((attempt:Record<string,any>)=>attempt.status==="not_submitted"&&!attempt.transactionId&&!attempt.hadPayload&&!attempt.signingStartedAt);}
export async function retryServicePurchase(tenant:string,id:string,context:ServiceHttpContext){
 const record=required("service_payment",tenant,id);const resource=new URL(record.resourceUrl);if(resource.origin!==context.origin||resource.pathname!=="/api/services/capacity/"+id)throw new DomainError("The signed service endpoint must match this application.",409);
 transaction(()=>{
  const current=required("service_payment",tenant,id);if(!provenUnsignedService(current))throw new DomainError("Only a proven not-submitted service attempt without any signing history can be explicitly retried.",409);
  const policy=activePolicy(tenant,current.policyId);paymentPolicy(tenant,current);assertIntentOpen(tenant,current.intentId,current.intentVersion);
  if(current.requestDigest!==digest({requestId:current.requestId,supplierId:current.supplierId,intentId:current.intentId,amountAtomic:current.amountAtomic,policyId:current.policyId})||current.amountAtomic!==process.env.HEDERA_CAPACITY_PRICE_TINYBAR||BigInt(current.amountAtomic)>BigInt(policy.perCallCapAtomic))throw new DomainError("The original service price or immutable request authority changed.",409);
  const exposure=list("service_payment",tenant).filter(p=>p.policyId===current.policyId&&!['rejected','cancelled'].includes(p.status)).reduce((sum,p)=>sum+BigInt(p.amountAtomic),0n);if(exposure>BigInt(policy.totalCapAtomic))throw new DomainError("The signed service allowance is exhausted.",409);
  assertSharedAllowance(current.amountAtomic);releaseAuthority(tenant,current.authorityReservationId||id+"-operating-authority");
  const attempt=(current.attempt||1)+1,authorityReservationId=id+"-operating-authority-"+attempt;reserveAuthority(tenant,authorityReservationId,'operating',current.amountAtomic,policy.sessionId||'local-session',settings(tenant));
  const attempts=[...(current.attempts??[]),{attempt:current.attempt||1,status:current.status,createdAt:current.attemptCreatedAt||current.createdAt,failedAt:current.lastAttemptFailedAt??null,transactionId:current.transactionId??null,hadPayload:!!current.payload,signingStartedAt:current.signingStartedAt??null}];
  put("service_payment",tenant,{...current,status:"reserved",attempt,attempts,authorityReservationId,attemptCreatedAt:new Date().toISOString(),explicitRetryAuthorizedAt:new Date().toISOString()});event(tenant,"service.retry_authorized","The original unsigned service request was explicitly retried under restored bounded authority.",{purchaseId:id,attempt});
 });
 return executeServicePurchase(tenant,id,context);
}
export async function executeServicePurchase(tenant:string,id:string,context:ServiceHttpContext){
 const initial=required("service_payment",tenant,id);
 if(initial.status==="confirmed")return safePurchase(initial);
 const resource=new URL(initial.resourceUrl);
 if(resource.origin!==context.origin||resource.pathname!=="/api/services/capacity/"+id||resource.search||resource.hash)throw new DomainError("The signed service URL must match this application origin and purchase.",409);
 if(initial.status!=="reserved")throw new DomainError("This service payment already started. Reconcile before any retry.",409);
 transaction(()=>{const current=required("service_payment",tenant,id);paymentPolicy(tenant,current);if(current.status!=="reserved")throw new DomainError("Service payment is already executing.",409);put("service_payment",tenant,{...current,status:"requesting",attempt:current.attempt||1,attemptCreatedAt:current.attemptCreatedAt||new Date().toISOString()});});
 try{
  const challenge=await fetch(resource,{method:"GET",headers:{Cookie:context.cookie},redirect:"error",cache:"no-store",signal:AbortSignal.timeout(25000)});
  if(challenge.status!==402)throw new DomainError("The protected HTTP service did not return a payment challenge.",502);
  const signed=await preparePaidRequest(challenge,paymentPolicy(tenant,initial),{role:"operating",onSigningStarted:async()=>{transaction(()=>{const current=required("service_payment",tenant,id);paymentPolicy(tenant,current);if(current.status!=="requesting")throw new DomainError("Service signing admission changed.",409);put("service_payment",tenant,{...current,status:"signing",signingStartedAt:new Date().toISOString()});});},onTransactionPrepared:async(payload)=>{transaction(()=>{const current=required("service_payment",tenant,id);const transactionId=signedTransactionId(payload);claimTransaction(tenant,id,transactionId);put("service_payment",tenant,{...current,status:"signed",transactionId,payload,requirements:payload.accepted});});}});
  transaction(()=>{const current=required("service_payment",tenant,id);paymentPolicy(tenant,current);if(!["requesting","signing","signed"].includes(current.status))throw new DomainError("The service request state changed before signing.",409);const transactionId=signedTransactionId(signed.payload);if(current.transactionId&&current.transactionId!==transactionId)throw new DomainError("The signed service transaction reference changed.",409);claimTransaction(tenant,id,transactionId);put("service_payment",tenant,{...current,status:"signed",requirements:signed.requirements,transactionId,payload:signed.payload});});
  const response=await fetch(resource,{method:"POST",headers:{...signed.headers,Cookie:context.cookie,Origin:context.origin,"Content-Type":"application/json"},body:"{}",redirect:"error",cache:"no-store",signal:AbortSignal.timeout(55000)});
  const current=required("service_payment",tenant,id);
  if(!response.ok||current.status!=="confirmed")throw new DomainError("The paid HTTP response is not authoritatively confirmed. Reconcile before retrying.",409);
  return safePurchase(current);
 }catch(error){transaction(()=>{const current=required("service_payment",tenant,id);if(!["confirmed","rejected"].includes(current.status))put("service_payment",tenant,{...current,status:current.transactionId||current.payload||current.signingStartedAt?"unknown":"not_submitted",lastAttemptFailedAt:new Date().toISOString()});if(!current.transactionId&&!current.payload&&!current.signingStartedAt)releaseAuthority(tenant,current.authorityReservationId||id+"-operating-authority");});throw error;}
}

export async function settleServicePurchase(tenant:string,id:string,payload:PaymentPayload){
 const purchase=required("service_payment",tenant,id);
 if(purchase.status==="confirmed")return safePurchase(purchase);
 if(!['reserved','signed'].includes(purchase.status))throw new DomainError("The service payment is not ready to settle.",409);
 const {requirements}=await serviceChallenge(tenant,id);const policy=paymentPolicy(tenant,purchase);
 transaction(()=>{const current=required("service_payment",tenant,id);paymentPolicy(tenant,current);if(!['reserved','signed'].includes(current.status))throw new DomainError("Service settlement is already in progress.",409);const transactionId=signedTransactionId(payload);claimTransaction(tenant,id,transactionId);put("service_payment",tenant,{...current,status:"submitted",requirements,transactionId});});
 try{const settled=await settleProtectedRequest(payload,requirements,policy);transaction(()=>{const current=required("service_payment",tenant,id);if(current.status==="confirmed")return;put("service_payment",tenant,{...current,status:"unknown",reportedTransactionId:settled.transaction,explorerUrl:"https://hashscan.io/testnet/transaction/"+encodeURIComponent(current.transactionId)});});return await reconcileServicePurchase(tenant,id);}
 catch(error){transaction(()=>{const current=required("service_payment",tenant,id);if(current.status!=="confirmed")put("service_payment",tenant,{...current,status:isProviderError(error)&&error.code==="PAYMENT_REJECTED"?"rejected":"unknown"});});throw error;}
}

export async function reconcileServicePurchase(tenant:string,id:string){
 const purchase=required("service_payment",tenant,id);if(purchase.status==="confirmed")return safePurchase(purchase);
 if(!["submitted","unknown","signed"].includes(purchase.status))throw new DomainError("This service purchase has no reconcilable settlement attempt.",409);
 if(!purchase.transactionId)throw new DomainError("No signed transaction is available for reconciliation.",409);
 const receipt=await reconcileHederaTransaction(purchase.transactionId,{payee:purchase.payee,asset:purchase.asset,amount:purchase.amountAtomic,notBeforeMs:Date.parse(purchase.attemptCreatedAt||purchase.createdAt),payer:purchase.payer});
 const charges=networkCharges(receipt.transactions||[]);if(!receipt.confirmed)throw new DomainError("Matching service settlement is not confirmed yet.",409);
 return transaction(()=>{
  const current=required("service_payment",tenant,id);if(current.status==="confirmed")return safePurchase(current);claimTransaction(tenant,id,current.transactionId);
  const input=current.input;const supplier=getSuppliers().find(s=>s.id===input.supplierId);
  if(!supplier)throw new DomainError("The assessed supplier no longer exists.",409);
  const reserved=committedSupplierStock(supplier.id);const availableQuantity=Math.max(0,supplier.stock-reserved);
  const available=supplier.available!==false&&availableQuantity>=input.quantity&&input.quantity>=supplier.minimumOrderQuantity;const servesArea=supplier.location.toLowerCase()===input.location.toLowerCase();
  const assessment={supplierId:input.supplierId,supplierVersion:supplier.catalogueVersion,catalogueAvailability:supplier.available,minimumOrderQuantity:supplier.minimumOrderQuantity,intentId:input.intentId,availableQuantity,reservedQuantity:reserved,requestedQuantity:input.quantity,available,servesArea,leadDays:supplier.leadDays,eligible:available&&servesArea,provenance:"synthetic_inventory_after_global_reservations",assessedAt:new Date().toISOString(),note:"Assessment of disclosed sample inventory after current reservations. Physical supplier capacity is not verified."};
  settleAuthority(tenant,current.authorityReservationId||id+"-operating-authority");const updated=put("service_payment",tenant,{...current,status:"confirmed",assessment,networkCharges:charges,confirmedAt:new Date().toISOString()});
  put("capacity_assessment",tenant,{...assessment,id:current.id+"-assessment",paymentId:current.id,transactionId:current.transactionId});
  put("ledger",tenant,{id:current.id+"-service-ledger",kind:"operating_service_payment",networkCharges:charges,amountAtomic:current.amountAtomic,asset:current.asset,network:current.network,transactionId:current.transactionId,status:"confirmed"});
  event(tenant,"service.confirmed","Paid capacity assessment is available.",{purchaseId:id,transactionId:current.transactionId});return safePurchase(updated);
 });
}

export function protectedServiceResult(tenant:string,id:string){const purchase=required("service_payment",tenant,id);if(purchase.status!=="confirmed"||!purchase.assessment)throw new DomainError("Payment is required before returning this assessment.",402);return {assessment:purchase.assessment,transactionId:purchase.transactionId,explorerUrl:purchase.explorerUrl};}

