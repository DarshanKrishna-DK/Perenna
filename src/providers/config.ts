export class ProviderError extends Error {
  constructor(public provider: string, message: string, public code = "PROVIDER_UNAVAILABLE", public diagnostic?:{requestId?:string;finishReason?:string;contentLength?:number;httpStatus?:number}) { super(message); this.name = "ProviderError"; }
}
export function isProviderError(error:unknown):error is ProviderError{return typeof error==="object"&&error!==null&&"name" in error&&error.name==="ProviderError"&&"provider" in error&&typeof error.provider==="string"&&"code" in error&&typeof error.code==="string"&&"message" in error&&typeof error.message==="string";}

export function requireEnabled(provider: string, flag: string) {
  if (process.env[flag] !== "true") throw new ProviderError(provider, `${provider} execution is paused until its usage budget is authorized.`, "AUTHORIZATION_REQUIRED");
}

export function secret(provider: string, name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new ProviderError(provider, `${name} is not configured.`, "CONFIGURATION_REQUIRED");
  return value;
}

export async function providerFetch(provider: string, url: string, init: RequestInit = {}): Promise<Response> {
  try {
    const response = await fetch(url, { ...init, signal: init.signal ?? AbortSignal.timeout(45_000), cache: "no-store" });
    if (!response.ok) throw new ProviderError(provider, `${provider} returned HTTP ${response.status}.`, `HTTP_${response.status}`);
    return response;
  } catch (error) {
    if (error instanceof ProviderError) throw error;
    throw new ProviderError(provider, `${provider} could not confirm the request outcome.`, "OUTCOME_UNKNOWN");
  }
}

export function providerReadiness() {
  return [
    { id: "0g", name: "0G Private Computer (mainnet API)", configured: Boolean(process.env.ZERO_G_API_KEY && process.env.ZERO_G_MODEL), enabled: process.env.INFERENCE_ENABLED === "true", purpose: "Mainnet-billed inference for the current key; token cost and balance unverified" },
    { id: "arkiv", name: "Arkiv Rabdi", configured: Boolean(process.env.ARKIV_ACCESS_KEY && process.env.ARKIV_PRIVATE_KEY), enabled: process.env.ARKIV_WRITES_ENABLED === "true", purpose: "Expiring public intent and signed evidence" },
    { id: "hedera", name: "Hedera testnet", configured: Boolean(process.env.HEDERA_ACCOUNT_ID && process.env.HEDERA_PRIVATE_KEY && process.env.HEDERA_MERCHANT_ACCOUNT_ID), enabled: process.env.HEDERA_PAYMENTS_ENABLED === "true", purpose: "Confirmed testnet settlement" },
    { id: "sarvam", name: "Sarvam", configured: Boolean(process.env.SARVAM_API_KEY), enabled: process.env.SPEECH_ENABLED === "true", purpose: "English and Hindi speech" },
    { id: "groq", name: "Groq fallback", configured: Boolean(process.env.GROQ_API_KEY && process.env.GROQ_MODEL), enabled: process.env.GROQ_FALLBACK_ENABLED === "true", purpose: "Explicitly authorized fallback" },
  ];
}

export function providerCapabilityReadiness(){
  const declarations=[
    {id:"inference",provider:"0G mainnet inference API",required:["ZERO_G_API_KEY","ZERO_G_MODEL","INFERENCE_MAX_CALLS"],flag:"INFERENCE_ENABLED"},
    {id:"speech",provider:"Sarvam",required:["SARVAM_API_KEY","SPEECH_MAX_CALLS"],flag:"SPEECH_ENABLED"},
    {id:"arkiv_read",provider:"Arkiv",required:["ARKIV_ACCESS_KEY"],flag:null},
    {id:"arkiv_write",provider:"Arkiv",required:["ARKIV_ACCESS_KEY","ARKIV_PRIVATE_KEY","ARKIV_WRITER_ADDRESS","ARKIV_MAX_FEE_WEI","ARKIV_MAX_TOTAL_FEE_WEI"],flag:"ARKIV_WRITES_ENABLED"},
    {id:"goods_payment",provider:"Hedera",required:["HEDERA_ACCOUNT_ID","HEDERA_PRIVATE_KEY","HEDERA_MERCHANT_ACCOUNT_ID","HEDERA_MAX_TOTAL_TINYBAR"],flag:"HEDERA_PAYMENTS_ENABLED"},
    {id:"service_payment",provider:"Hedera",required:["HEDERA_OPERATING_ACCOUNT_ID","HEDERA_OPERATING_PRIVATE_KEY","HEDERA_SERVICE_POLICY_SIGNER","HEDERA_CAPACITY_PRICE_TINYBAR","HEDERA_MAX_TOTAL_TINYBAR"],flag:"HEDERA_PAYMENTS_ENABLED"},
    {id:"fee_collection",provider:"Hedera",required:["HEDERA_SUPPLIER_ACCOUNT_ID","HEDERA_SUPPLIER_PRIVATE_KEY","HEDERA_SUPPLIER_SIGNER_ADDRESS","HEDERA_FEE_ACCOUNT_ID","HEDERA_MAX_TOTAL_TINYBAR"],flag:"HEDERA_FEE_PAYMENTS_ENABLED"},
    {id:"standing_execution",provider:"Hedera",required:["HEDERA_SPA_CONTRACT","HEDERA_SPA_RUNTIME_CODE_HASH","HEDERA_EVM_PRIVATE_KEY","HEDERA_SPA_MAX_GAS_WEI"],flag:"HEDERA_SPA_EXECUTION_ENABLED"},
  ];
  return declarations.map(item=>{const missing=item.required.filter(name=>{const value=process.env[name]?.trim();return !value||/(?:_CALLS|_WEI|_TINYBAR|_GAS)$/.test(name)&&(!/^\d+$/.test(value)||BigInt(value)<=0n);});const enabled=(item.flag===null||process.env[item.flag]==="true")&&(item.id!=="fee_collection"||process.env.HEDERA_PAYMENTS_ENABLED==="true")&&(item.id!=="arkiv_write"||process.env.ARKIV_EXCLUSIVE_WRITER==="true");return {id:item.id,provider:item.provider,configurationComplete:missing.length===0,executionEnabled:enabled,missing,status:missing.length?"configuration_required":!enabled?"authorization_required":"configured",verified:false,limitation:"Configuration presence only. Wallet ownership, usable balance, remaining budget, deployed code and live operation must be verified independently."};});
}
