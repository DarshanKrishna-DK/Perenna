import { x402Client, x402HTTPClient } from "@x402/core/client";
import { HTTPFacilitatorClient } from "@x402/core/server";
import type { PaymentPayload, PaymentRequirements } from "@x402/core/types";
import { createClientHederaSigner, inspectHederaTransaction } from "@x402/hedera";
import { ExactHederaScheme } from "@x402/hedera/exact/client";
import { PrivateKey, Transaction } from "@hiero-ledger/sdk";
import { ProviderError, providerFetch, requireEnabled, secret } from "./config";

export const HEDERA_NETWORK = "hedera:testnet" as const;
export type PaymentPolicy = { payer?: string; payee: string; asset: string; maxAmount: string; expiresAt: number; resourceUrl: string; policyVersion: string; maxNetworkFeeAtomic?:string; maxTransactionFeeAtomic?:string; networkFeePayer?:"facilitator"; facilitator?:"https://x402.org/facilitator" };
function facilitator() { return new HTTPFacilitatorClient({ url: "https://x402.org/facilitator", timeoutMs: 20_000 }); }
export async function facilitatorCapabilities() { return facilitator().getSupported(); }
export function signedTransactionId(payload: PaymentPayload) {
  const transaction = (payload.payload as { transaction?: string }).transaction;
  if (!transaction) throw new ProviderError("Hedera", "The signed transaction is missing.", "INVALID_PAYMENT");
  try {
    const id = Transaction.fromBytes(Buffer.from(transaction, "base64")).transactionId?.toString();
    if (!id) throw new Error();
    return id;
  } catch { throw new ProviderError("Hedera", "The signed transaction cannot be decoded.", "INVALID_PAYMENT"); }
}
export function validatePayment(requirements: PaymentRequirements, policy: PaymentPolicy) {
  if (requirements.network !== HEDERA_NETWORK || requirements.scheme !== "exact" || requirements.payTo !== policy.payee || requirements.asset !== policy.asset || !/^0\.0\.\d+$/.test(policy.payee) || !/^0\.0\.\d+$/.test(policy.asset)) throw new ProviderError("Hedera", "Payment terms do not match the approved policy.", "POLICY_MISMATCH");
  if (!/^\d+$/.test(requirements.amount) || !/^\d+$/.test(policy.maxAmount) || BigInt(requirements.amount) <= 0n || BigInt(requirements.amount) > BigInt(policy.maxAmount) || policy.expiresAt <= Date.now()) throw new ProviderError("Hedera", "Payment exceeds its amount or validity bounds.", "BUDGET_EXCEEDED");
}

export function parseHederaPrivateKey(value:string,keyType:string|undefined,configurationName="HEDERA_KEY_TYPE"):PrivateKey{
  const encoded=value.trim().replace(/^0x/i,"");
  try{
    if(encoded.length!==64&&PrivateKey.isDerKey(encoded))return PrivateKey.fromStringDer(encoded);
    if(!/^[a-fA-F0-9]{64}$/.test(encoded))throw new ProviderError("Hedera","The configured private key is not a supported DER or raw key.","INVALID_KEY_CONFIGURATION");
    if(keyType!=="ecdsa"&&keyType!=="ed25519")throw new ProviderError("Hedera",configurationName+" must explicitly select ecdsa or ed25519 for a raw private key.","KEY_TYPE_REQUIRED");
    return keyType==="ecdsa"?PrivateKey.fromStringECDSA(encoded):PrivateKey.fromStringED25519(encoded);
  }catch(error){
    if(error instanceof ProviderError)throw error;
    throw new ProviderError("Hedera","The configured private key could not be parsed for its selected algorithm.","INVALID_KEY_CONFIGURATION");
  }
}

export function inspectPaymentNetworkFees(payload:PaymentPayload,requirements:PaymentRequirements,policy:PaymentPolicy){
  if(policy.networkFeePayer!=="facilitator"||policy.facilitator!=="https://x402.org/facilitator"||!/^\d+$/.test(policy.maxNetworkFeeAtomic??"")||!/^\d+$/.test(policy.maxTransactionFeeAtomic??"")||BigInt(policy.maxTransactionFeeAtomic??0)<=0n)throw new ProviderError("Hedera","Freeze the user network-fee bound, facilitator attribution and underlying transaction-fee cap before signing.","FEE_POLICY_REQUIRED");
  const declared=requirements.extra?.feePayer;
  if(typeof declared!=="string"||!/^0\.0\.\d+$/.test(declared)||declared===policy.payer)throw new ProviderError("Hedera","The challenge does not identify a separate facilitator network fee payer.","POLICY_MISMATCH");
  try{
    const encoded=(payload.payload as {transaction?:string}).transaction;
    if(!encoded)throw new Error();const tx=Transaction.fromBytes(Buffer.from(encoded,"base64"));
    const payer=tx.transactionId?.accountId?.toString();const maximum=tx.maxTransactionFee?.toTinybars().toString();
    if(payer!==declared||!maximum||!/^\d+$/.test(maximum)||BigInt(maximum)<=0n||BigInt(maximum)>BigInt(policy.maxTransactionFeeAtomic!))throw new Error();
    return {networkFeePayer:"facilitator" as const,feePayerAccountId:payer,facilitator:policy.facilitator,userMaximumChargeAtomic:"0",approvedUserFeeCapAtomic:policy.maxNetworkFeeAtomic,transactionMaximumFeeAtomic:maximum,approvedTransactionFeeCapAtomic:policy.maxTransactionFeeAtomic};
  }catch{throw new ProviderError("Hedera","The signed transaction fee payer or maximum fee differs from its approved policy.","FEE_POLICY_MISMATCH");}
}

export function boundedNativeHederaClient(scheme:Parameters<x402Client["register"]>[1],maximumAtomic:string){
 if(!/^[1-9]\d*$/.test(maximumAtomic))throw new ProviderError("Hedera","A positive exact atomic spend cap is required.","BUDGET_REQUIRED");
 return new x402Client().register(HEDERA_NETWORK,scheme).setSpendControls({allowedAssets:[{network:HEDERA_NETWORK,asset:"0.0.0",maxAmountPerPayment:maximumAtomic}]}).registerPolicy((version,requirements)=>version===2?requirements.filter(requirement=>requirement.network===HEDERA_NETWORK&&requirement.scheme==="exact"&&requirement.asset==="0.0.0"&&/^[1-9]\d*$/.test(requirement.amount)&&BigInt(requirement.amount)<=BigInt(maximumAtomic)):[]);
}
export type PaymentPreparationOptions={role:"goods"|"operating"|"supplier_fee";onSigningStarted?:()=>Promise<void>;onTransactionPrepared?:(payload:PaymentPayload)=>Promise<void>};
export async function preparePaidRequest(challenge: Response, policy: PaymentPolicy, options:PaymentPreparationOptions={role:"goods"}) {
  requireEnabled("Hedera", "HEDERA_PAYMENTS_ENABLED");
  if(options.role==="supplier_fee")requireEnabled("Hedera","HEDERA_FEE_PAYMENTS_ENABLED");
  const accountId=secret("Hedera",options.role==="supplier_fee"?"HEDERA_SUPPLIER_ACCOUNT_ID":options.role==="operating"?"HEDERA_OPERATING_ACCOUNT_ID":"HEDERA_ACCOUNT_ID");
  const privateKey=secret("Hedera",options.role==="supplier_fee"?"HEDERA_SUPPLIER_PRIVATE_KEY":options.role==="operating"?"HEDERA_OPERATING_PRIVATE_KEY":"HEDERA_PRIVATE_KEY");
  if(options.role==="operating"&&accountId===process.env.HEDERA_ACCOUNT_ID)throw new ProviderError("Hedera","Service spending requires a separate operating payer.","POLICY_MISMATCH");
  if(policy.payer && policy.payer !== accountId) throw new ProviderError("Hedera","The configured signer does not match the approved payer.","POLICY_MISMATCH");
  const keyTypeName=options.role==="supplier_fee"?"HEDERA_SUPPLIER_KEY_TYPE":options.role==="operating"?"HEDERA_OPERATING_KEY_TYPE":"HEDERA_KEY_TYPE";
  const signerKey=parseHederaPrivateKey(privateKey,process.env[keyTypeName]?.trim().toLowerCase(),keyTypeName);
  const signer=createClientHederaSigner(accountId,signerKey,{network:HEDERA_NETWORK});
  const guardedSigner={...signer,createPartiallySignedTransferTransaction:async(requirements:PaymentRequirements)=>{await options.onSigningStarted?.();const transaction=await signer.createPartiallySignedTransferTransaction(requirements);await options.onTransactionPrepared?.({x402Version:2,resource:{url:policy.resourceUrl},accepted:requirements,payload:{transaction}});return transaction;}};
  const client=boundedNativeHederaClient(new ExactHederaScheme(guardedSigner),policy.maxAmount);
  const httpClient = new x402HTTPClient(client);
  const required = httpClient.getPaymentRequiredResponse(name => challenge.headers.get(name));
  if (required.resource?.url !== policy.resourceUrl) throw new ProviderError("Hedera", "The protected resource changed.", "POLICY_MISMATCH");
  const accepted = required.accepts.filter(requirement => requirement.network === HEDERA_NETWORK && requirement.scheme === "exact");
  if (accepted.length !== 1) throw new ProviderError("Hedera", "A single supported Hedera challenge is required.", "UNSUPPORTED_CHALLENGE");
  validatePayment(accepted[0], policy);
  // Validate the fee policy before the SDK creates any partially signed transfer.
  if(policy.networkFeePayer!=="facilitator"||policy.facilitator!=="https://x402.org/facilitator"||!/^\d+$/.test(policy.maxNetworkFeeAtomic??"")||!/^\d+$/.test(policy.maxTransactionFeeAtomic??"")||BigInt(policy.maxTransactionFeeAtomic??0)<=0n||typeof accepted[0].extra?.feePayer!=="string"||!/^0\.0\.\d+$/.test(accepted[0].extra.feePayer)||accepted[0].extra.feePayer===policy.payer)throw new ProviderError("Hedera","A separately attributed facilitator fee and explicit fee bounds are required.","FEE_POLICY_REQUIRED");
  const payload = await httpClient.createPaymentPayload({ ...required, accepts: accepted });
  const networkFee=inspectPaymentNetworkFees(payload,accepted[0],policy);
  return { payload, headers: httpClient.encodePaymentSignatureHeader(payload), requirements: accepted[0], networkFee, policyVersion: policy.policyVersion };
}

export async function settleProtectedRequest(payload: PaymentPayload, requirements: PaymentRequirements, policy: PaymentPolicy) {
  requireEnabled("Hedera", "HEDERA_PAYMENTS_ENABLED"); validatePayment(requirements, policy);
  if(payload.resource?.url !== policy.resourceUrl)throw new ProviderError("Hedera","The signed payment resource does not match this purchase.","POLICY_MISMATCH");
  if(policy.payer){
    const encoded=(payload.payload as {transaction?:string}).transaction;
    if(!encoded)throw new ProviderError("Hedera","A signed transfer is required.","INVALID_PAYMENT");
    let inspected:ReturnType<typeof inspectHederaTransaction>;
    try{inspected=inspectHederaTransaction(encoded);}catch{throw new ProviderError("Hedera","The signed transfer cannot be inspected.","INVALID_PAYMENT");}
    const unrelatedAsset=Object.entries(inspected.tokenTransfers).some(([asset,entries])=>asset!==requirements.asset&&entries.some(x=>BigInt(x.amount)!==0n))||(requirements.asset!=="0.0.0"&&inspected.hbarTransfers.some(x=>BigInt(x.amount)!==0n));
    const transfers=requirements.asset==="0.0.0"?inspected.hbarTransfers:inspected.tokenTransfers[requirements.asset]??[];
    const sum=(account:string)=>transfers.filter(x=>x.accountId===account).reduce((n,x)=>n+BigInt(x.amount),0n);
    if(unrelatedAsset||inspected.hasNonTransferOperations||sum(policy.payer)!==-BigInt(requirements.amount)||sum(policy.payee)!==BigInt(requirements.amount)||transfers.some(x=>BigInt(x.amount)!==0n&&![policy.payer,policy.payee].includes(x.accountId)))throw new ProviderError("Hedera","The signed transfer does not match the approved payer and recipient.","POLICY_MISMATCH");
  }
  if (payload.accepted.payTo !== requirements.payTo || payload.accepted.amount !== requirements.amount || payload.accepted.asset !== requirements.asset || payload.accepted.network !== HEDERA_NETWORK) throw new ProviderError("Hedera", "Signed payment does not match the protected request.", "POLICY_MISMATCH");
  inspectPaymentNetworkFees(payload,requirements,policy);
  const f = facilitator();
  const verified = await f.verify(payload, requirements);
  if (!verified.isValid) throw new ProviderError("Hedera", "The facilitator rejected payment verification.", "PAYMENT_REJECTED");
  try {
    const settled = await f.settle(payload, requirements);
    if (!settled.success || !settled.transaction) throw new ProviderError("Hedera", "Settlement was not confirmed.", "SETTLEMENT_UNCONFIRMED");
    return { ...settled, explorerUrl: `https://hashscan.io/testnet/transaction/${encodeURIComponent(settled.transaction)}` };
  } catch (error) {
    if (error instanceof ProviderError) throw error;
    throw new ProviderError("Hedera", "Settlement outcome is unknown. Reconcile before retrying.", "OUTCOME_UNKNOWN");
  }
}

export async function reconcileHederaTransaction(transactionId: string, expected?: Pick<PaymentPolicy,"payee"|"asset"> & { amount: string; notBeforeMs?:number; payer?:string }) {
  if (!/^0\.0\.\d+[-@]\d+[.-]\d+$/.test(transactionId)) throw new ProviderError("Hedera", "A valid transaction ID is required.", "INVALID_TRANSACTION");
  const mirrorId = transactionId.replace("@", "-").replace(/\.(\d+)$/, "-$1");
  const response = await providerFetch("Hedera", `https://testnet.mirrornode.hedera.com/api/v1/transactions/${encodeURIComponent(mirrorId)}`);
  const result = await response.json();
  const transactions = result.transactions ?? [];
  const chainSuccess = transactions.some((t: { result: string }) => t.result === "SUCCESS");
  const matched = expected && transactions.some((t: { result:string; consensus_timestamp?:string; transfers?:Array<{account:string;amount:number}>; token_transfers?:Array<{account:string;amount:number;token_id:string}> }) => {
    if (t.result !== "SUCCESS") return false;
    if(expected.notBeforeMs!==undefined&&(!t.consensus_timestamp||Number(t.consensus_timestamp)*1000<expected.notBeforeMs))return false;
    const transfers = expected.asset === "0.0.0" ? t.transfers ?? [] : (t.token_transfers ?? []).filter(x=>x.token_id===expected.asset);
    if (transfers.some(x=>!Number.isSafeInteger(x.amount))) return false;
    if(expected.payer&&transfers.filter(x=>x.account===expected.payer).reduce((sum,x)=>sum+BigInt(x.amount),0n)!==-BigInt(expected.amount))return false;
    return transfers.filter(x=>x.account===expected.payee).reduce((sum,x)=>sum+BigInt(x.amount),0n) === BigInt(expected.amount);
  });
  return { confirmed: Boolean(chainSuccess && matched), chainSuccess, termsVerified: Boolean(matched), transactions, network: HEDERA_NETWORK };
}
