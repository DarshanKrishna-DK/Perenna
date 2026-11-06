import { createPublicClient, createWalletClient, ExpirationTime } from "@arkiv-network/sdk";
import { rabdi } from "@arkiv-network/sdk/chains";
import { addr, bool, bytes, defineSchema, str, u64 } from "@arkiv-network/sdk/schema";
import { z } from "zod";
import { and, eq, gt } from "@arkiv-network/sdk/query";
import { createPublicClient as createRpcClient, decodeEventLog, http, isAddress, type Address, type Hex } from "viem";
import { privateKeyToAccount, toAccount } from "viem/accounts";
import { isProviderError, ProviderError, requireEnabled, secret } from "./config";

import { ENTITY_EVENTS_ABI } from "@arkiv-network/sdk/entity";
import type { CreateEntityOptions } from "@arkiv-network/sdk";
import { digest } from "../domain/procurement";
import { ARKIV_REGISTRY, captureArkivCreate, captureArkivSignedHash, checkpointArkivWriter, claimArkivWriter, failArkivWriter, reserveArkivFee } from "./arkiv-writer";

export const Requests = defineSchema("perenna.intent.v2", { item:str().indexed(),unit:str(),quantity:u64(),area:str().indexed(),requestExpiresMs:u64().indexed(),deliveryDeadlineMs:u64().indexed(),deliveryTimezone:str(),requestVersion:u64().indexed(),policyVersion:u64().indexed(),createdMs:u64(),businessCommitment:str().indexed(),requestCommitment:str().indexed(),schemaVersion:str() });
const publicIntentSchema=z.object({item:z.string().min(1),unit:z.string().min(1),quantity:z.number().int().positive().safe(),area:z.string().min(1),requestExpiresMs:z.number().int().positive().safe(),deliveryDeadlineMs:z.number().int().positive().safe(),deliveryTimezone:z.string().min(1).max(80).refine(value=>{try{new Intl.DateTimeFormat('en',{timeZone:value});return true;}catch{return false;}}),requestVersion:z.number().int().positive().safe(),policyVersion:z.number().int().positive().safe(),createdMs:z.number().int().positive().safe(),businessCommitment:z.string().regex(/^0x[0-9a-fA-F]{64}$/),requestCommitment:z.string().regex(/^0x[0-9a-fA-F]{64}$/)}).strict();
export type PublicIntent=z.infer<typeof publicIntentSchema>;
function approvedPublicIntent(value:PublicIntent){const parsed=publicIntentSchema.safeParse(value);if(!parsed.success||parsed.data.requestExpiresMs<=Date.now()||parsed.data.deliveryDeadlineMs<=Date.now()||parsed.data.requestExpiresMs>parsed.data.deliveryDeadlineMs||parsed.data.createdMs>Date.now())throw new ProviderError("Arkiv","The public request requires valid server-issued version, policy, time and opaque commitment metadata.","INVALID_INTENT");return parsed.data;}
function intentValues(intent:PublicIntent){return {...intent,quantity:u64(BigInt(intent.quantity)),requestExpiresMs:u64(BigInt(intent.requestExpiresMs)),deliveryDeadlineMs:u64(BigInt(intent.deliveryDeadlineMs)),requestVersion:u64(BigInt(intent.requestVersion)),policyVersion:u64(BigInt(intent.policyVersion)),createdMs:u64(BigInt(intent.createdMs)),schemaVersion:"2"};}
const rowValue=(row:Record<string,any>,name:string)=>row[name]&&typeof row[name]==="object"&&"value" in row[name]?row[name].value:row[name];
export function matchesPublicIntent(row:Record<string,any>,projection:PublicIntent,expected:{writer:Address;entityKey:Hex;expiresAtBlock?:string}){
 try{const intent=approvedPublicIntent(projection);if(String(rowValue(row,"$key")).toLowerCase()!==expected.entityKey.toLowerCase()||String(rowValue(row,"$creator")).toLowerCase()!==expected.writer.toLowerCase()||String(rowValue(row,"$owner")).toLowerCase()!==expected.writer.toLowerCase()||row.$creationFlags?.readonly!==true||row.$creationFlags?.permissionlessExtension!==false||rowValue(row,"schemaVersion")!=="2")return false;
  if(expected.expiresAtBlock!==undefined&&BigInt(rowValue(row,"$expiresAt"))!==BigInt(expected.expiresAtBlock))return false;
  return Object.entries(intent).every(([name,value])=>typeof value==="number"?BigInt(rowValue(row,name))===BigInt(value):rowValue(row,name)===value);
 }catch{return false;}
}
export function arkivClient() { return createPublicClient({ chain: rabdi({ accessKey: secret("Arkiv", "ARKIV_ACCESS_KEY") }), transport: http() }); }

export async function discoverIntents(expectedWriter:Address,area:string,expected:{projection:PublicIntent;entityKey:Hex;expiresAtBlock?:string}){
 if(!isAddress(expectedWriter)||!/^0x[0-9a-fA-F]{64}$/.test(expected.entityKey))throw new ProviderError("Arkiv","The confirmed publisher and entity key are required.","INVALID_PUBLISHER");
 const projection=approvedPublicIntent(expected.projection);
 try{
  const reader=arkivClient();if(await reader.getChainId()!==7794095)throw new ProviderError("Arkiv","Only Rabdi discovery is permitted.","NETWORK_MISMATCH");
  const result=await reader.select().from(Requests).where(and(eq("area",area),gt("requestExpiresMs",u64(BigInt(Date.now()))),eq("$creator",addr(expectedWriter)),eq("requestCommitment",projection.requestCommitment),eq("requestVersion",u64(BigInt(projection.requestVersion))),eq("policyVersion",u64(BigInt(projection.policyVersion))))).limit(30).fetch();
  const latest=await reader.getBlockNumber({cacheTime:0});if(!expected.expiresAtBlock||!/^\d+$/.test(expected.expiresAtBlock)||BigInt(expected.expiresAtBlock)<=latest)throw new ProviderError("Arkiv","The confirmed request entity is expired at the latest chain head.","ENTITY_EXPIRED");
  return {...result,entities:result.entities.filter(row=>matchesPublicIntent(row,projection,{writer:expectedWriter,entityKey:expected.entityKey,expiresAtBlock:expected.expiresAtBlock}))};
 }catch(error){if(isProviderError(error))throw error;throw new ProviderError("Arkiv","Current-version request discovery failed. No private transport details are exposed.");}
}

export async function quoteCreate(operation:unknown,expiresMs:number,prepare:(wallet:ReturnType<typeof createWalletClient>,options:CreateEntityOptions)=>Promise<unknown>){
 const writer=secret("Arkiv","ARKIV_WRITER_ADDRESS");if(!isAddress(writer))throw new ProviderError("Arkiv","Configure the public writer address before unsigned preparation.","CONFIGURATION_REQUIRED");
 const refuse=async():Promise<never>=>{throw new ProviderError("Arkiv","Signing is blocked during fee preparation.","WRITE_BLOCKED");};
 const account=toAccount({address:writer,signMessage:refuse,signTransaction:refuse,signTypedData:refuse});
 try{
  const chain=rabdi({accessKey:secret("Arkiv","ARKIV_ACCESS_KEY")});const transport=http(undefined,{retryCount:0,timeout:15000,fetchOptions:{cache:"no-store",redirect:"error"}});const rpc=createRpcClient({chain,transport,cacheTime:0});
  if(await rpc.getChainId()!==7794095)throw new ProviderError("Arkiv","Only Rabdi is permitted.","NETWORK_MISMATCH");
  const head=await rpc.getBlock({blockTag:"latest"});const expiry=head.number+BigInt(Math.max(1,Math.ceil(Math.min(86400,(expiresMs-Date.now())/1000)/2)));
  const options:CreateEntityOptions={expiration:ExpirationTime.atBlock(expiry),salt:BigInt("0x"+digest(operation).slice(0,32)),flags:{readonly:true,permissionlessExtension:false}};
  const captured=await captureArkivCreate(account,chain,transport({chain}) as any,wallet=>prepare(wallet,options));
  const [gasPrice,balance,latest,pending,current]=await Promise.all([rpc.getGasPrice(),rpc.getBalance({address:writer,blockTag:"latest"}),rpc.getTransactionCount({address:writer,blockTag:"latest"}),rpc.getTransactionCount({address:writer,blockTag:"pending"}),rpc.getBlock({blockTag:"latest"})]);
  const gas=captured.estimate*2n>1000000n?captured.estimate*2n:1000000n;const fee=gas*gasPrice;
  if(gas>current.gasLimit/2n)throw new ProviderError("Arkiv","The exact estimate exceeds half the latest block gas limit.","BUDGET_EXCEEDED");
  return {network:"arkiv:rabdi",chainId:7794095,writer,publicProjection:operation,estimateGas:captured.estimate.toString(),gas:gas.toString(),gasPriceWei:gasPrice.toString(),maximumFeeWei:fee.toString(),observedBalanceWei:balance.toString(),balanceSufficient:balance>=fee,nonceClear:latest===pending,latestNonce:latest,pendingNonce:pending,observedBlock:current.number.toString(),expiresAtBlock:expiry.toString(),unsignedTransaction:{from:writer,to:ARKIV_REGISTRY,data:captured.data,value:"0",chainId:7794095,gas:gas.toString(),gasPrice:gasPrice.toString(),nonce:latest},signed:false,submitted:false,snapshotOnly:true,limitation:"Unsigned fee scope only. Actual publication requires exclusive writer custody, explicit budgets and a fresh re-estimate before signing."};
 }catch(error){if(isProviderError(error))throw error;throw new ProviderError("Arkiv","Unsigned fee preparation failed. No signing or broadcast was admitted.","ESTIMATE_FAILED");}
}
export async function prepareIntentPublication(intent:PublicIntent){
 intent=approvedPublicIntent(intent);
 const values=intentValues(intent);
 return quoteCreate({kind:"intent",...intent},intent.requestExpiresMs,(wallet,options)=>wallet.createEntity(Requests,values,options));
}
export type WriteResult={entityKey:Hex;txHash:Hex;expiresAt:bigint};
export type WriteAuthorization={estimatedGas?:bigint;maxFeeWei:bigint};
export async function guardedCreate<T>(operation:unknown,expiresMs:number,authorization:WriteAuthorization,prepare:(wallet:ReturnType<typeof createWalletClient>,options:CreateEntityOptions)=>Promise<unknown>,verify:(result:WriteResult,writer:Address)=>Promise<T>){
 requireEnabled("Arkiv","ARKIV_WRITES_ENABLED");requireEnabled("Arkiv","ARKIV_EXCLUSIVE_WRITER");
 const key=secret("Arkiv","ARKIV_PRIVATE_KEY");if(!/^0x[0-9a-fA-F]{64}$/.test(key))throw new ProviderError("Arkiv","The authorized writer is not configured.","CONFIGURATION_REQUIRED");
 let account:ReturnType<typeof privateKeyToAccount>;try{account=privateKeyToAccount(key as Hex);}catch{throw new ProviderError("Arkiv","The local writer key is invalid.","CONFIGURATION_REQUIRED");}const expected=secret("Arkiv","ARKIV_WRITER_ADDRESS");
 if(!isAddress(expected)||expected.toLowerCase()!==account.address.toLowerCase())throw new ProviderError("Arkiv","The local writer does not match the approved public address.","WRITER_MISMATCH");
 const total=secret("Arkiv","ARKIV_MAX_TOTAL_FEE_WEI");if(!/^\d+$/.test(total)||BigInt(total)<=0n)throw new ProviderError("Arkiv","A positive cumulative Arkiv fee allowance is required.","BUDGET_REQUIRED");
 const claim=claimArkivWriter(account.address,operation);
 try{
  const chain=rabdi({accessKey:secret("Arkiv","ARKIV_ACCESS_KEY")});
  const transport=http(undefined,{retryCount:0,timeout:15000,fetchOptions:{cache:"no-store",redirect:"error"}});
  const rpc=createRpcClient({chain,transport,cacheTime:0});
  if(await rpc.getChainId()!==7794095)throw new ProviderError("Arkiv","Only Rabdi is permitted.","NETWORK_MISMATCH");
  const block=await rpc.getBlock({blockTag:"latest"});
  const blocks=BigInt(Math.max(1,Math.ceil(Math.min(86400,(expiresMs-Date.now())/1000)/2)));
  const expiresAt=block.number+blocks;
  const options:CreateEntityOptions={expiration:ExpirationTime.atBlock(expiresAt),salt:BigInt("0x"+digest(operation).slice(0,32)),flags:{readonly:true,permissionlessExtension:false}};
  const raw=transport({chain});
  const captured=await captureArkivCreate(account,chain,raw as any,wallet=>prepare(wallet,options));
  const snapshot=async()=>{const [chainId,latest,pending,gasPrice,balance,head]=await Promise.all([rpc.getChainId(),rpc.getTransactionCount({address:account.address,blockTag:"latest"}),rpc.getTransactionCount({address:account.address,blockTag:"pending"}),rpc.getGasPrice(),rpc.getBalance({address:account.address,blockTag:"latest"}),rpc.getBlock({blockTag:"latest"})]);return {chainId,latest,pending,gasPrice,balance,head};};
  const current=await snapshot();const gas=captured.estimate*2n>1000000n?captured.estimate*2n:1000000n;const cost=gas*current.gasPrice;
  if(current.chainId!==7794095||current.latest!==current.pending||current.head.number>=expiresAt)throw new ProviderError("Arkiv","Reconcile the writer chain, pending nonce or expiration before signing.","PREFLIGHT_FAILED");
  if(authorization.maxFeeWei<=0n||gas>current.head.gasLimit/2n||cost>authorization.maxFeeWei||cost>current.balance)throw new ProviderError("Arkiv","The exact write exceeds its approved gas, fee or balance bound.","BUDGET_EXCEEDED");
  const unsigned={chainId:7794095,to:ARKIV_REGISTRY as Address,data:captured.data,value:0n,nonce:current.latest,gas,gasPrice:current.gasPrice,type:"legacy" as const};
  reserveArkivFee(claim,cost,BigInt(total),{intent:JSON.parse(JSON.stringify(unsigned,(_,value)=>typeof value==="bigint"?value.toString():value)),estimateGas:captured.estimate.toString(),expiresAt:expiresAt.toString()});
  const final=await snapshot();const finalEstimate=await rpc.estimateGas({account:account.address,to:ARKIV_REGISTRY as Address,data:captured.data,value:0n,gasPrice:current.gasPrice,blockTag:"latest"});requireEnabled("Arkiv","ARKIV_WRITES_ENABLED");requireEnabled("Arkiv","ARKIV_EXCLUSIVE_WRITER");
  if(final.chainId!==7794095||final.latest!==current.latest||final.pending!==current.latest||final.gasPrice!==current.gasPrice||final.balance<cost||finalEstimate<=0n||gas<finalEstimate*2n||gas>final.head.gasLimit/2n||final.head.number>=expiresAt)throw new ProviderError("Arkiv","Writer state changed after preparation. No signature was admitted.","PREFLIGHT_CHANGED");
  const signedTransaction=await account.signTransaction(unsigned);
  const txHash=captureArkivSignedHash(claim,signedTransaction);
  const returned=await rpc.sendRawTransaction({serializedTransaction:signedTransaction});
  if(returned.toLowerCase()!==txHash.toLowerCase())throw new ProviderError("Arkiv","The provider returned a different transaction hash.","OUTCOME_UNKNOWN");
  const receipt=await rpc.waitForTransactionReceipt({hash:txHash,timeout:45000});
  if(receipt.transactionHash.toLowerCase()!==txHash.toLowerCase()||receipt.from.toLowerCase()!==account.address.toLowerCase()||receipt.to?.toLowerCase()!==ARKIV_REGISTRY)throw new ProviderError("Arkiv","The receipt does not authenticate the signed create.","READBACK_MISMATCH");
  if(receipt.status!=="success")throw new ProviderError("Arkiv","The Arkiv write reverted. Reconcile the journal before another write.","WRITE_REVERTED");
  const mined=await rpc.getTransaction({hash:txHash});
  const canonical=await rpc.getBlock({blockNumber:receipt.blockNumber});
  if(canonical.hash!==receipt.blockHash||mined.from.toLowerCase()!==account.address.toLowerCase()||mined.to?.toLowerCase()!==ARKIV_REGISTRY||mined.input.toLowerCase()!==captured.data.toLowerCase()||mined.value!==0n||mined.chainId!==7794095||mined.nonce!==current.latest||mined.gas!==gas||mined.gasPrice!==current.gasPrice)throw new ProviderError("Arkiv","The mined transaction differs from the frozen writer intent.","READBACK_MISMATCH");
  const created=receipt.logs.filter(log=>log.address.toLowerCase()===ARKIV_REGISTRY).flatMap(log=>{try{const event=decodeEventLog({abi:ENTITY_EVENTS_ABI,data:log.data,topics:log.topics});return event.eventName==="EntityCreated"?[event.args]:[];}catch{return [];}});
  if(created.length!==1||created[0].owner.toLowerCase()!==account.address.toLowerCase()||created[0].expiresAt!==expiresAt||created[0].creationFlags!==1)throw new ProviderError("Arkiv","The confirmed create event differs from the frozen public write.","READBACK_MISMATCH");
  const result={entityKey:created[0].entityKey,txHash,expiresAt};
  checkpointArkivWriter(claim,"receipt_confirmed",{entityKey:result.entityKey,transactionHash:txHash,expiresAt:expiresAt.toString(),receiptBlock:receipt.blockNumber.toString(),receiptConfirmed:true});
  const verified=await verify(result,account.address);
  checkpointArkivWriter(claim,"verified",{verifiedAt:new Date().toISOString()});return verified;
 }catch(error){try{failArkivWriter(claim);}catch{throw new ProviderError("Arkiv","Writer journal recovery is required before any publication.","WRITER_LOCKED");}if(isProviderError(error))throw error;throw new ProviderError("Arkiv","Arkiv preparation or publication failed. Inspect the durable writer journal without retrying a submitted operation.","WRITE_UNVERIFIED");}
}
function verifyMetadata(entity:any,result:WriteResult,writer:Address){if(entity.$key?.toLowerCase()!==result.entityKey.toLowerCase()||entity.$creator?.toLowerCase()!==writer.toLowerCase()||entity.$owner?.toLowerCase()!==writer.toLowerCase()||entity.$expiresAt!==result.expiresAt||entity.$creationFlags?.readonly!==true||entity.$creationFlags?.permissionlessExtension!==false)throw new ProviderError("Arkiv","Published entity metadata differs from the frozen create.","READBACK_MISMATCH");}
export async function publishIntent(intent:PublicIntent,authorization:WriteAuthorization){
 requireEnabled("Arkiv","ARKIV_WRITES_ENABLED");
 intent=approvedPublicIntent(intent);
 const values=intentValues(intent);
 return guardedCreate({kind:"intent",...intent},intent.requestExpiresMs,authorization,(wallet,options)=>wallet.createEntity(Requests,values,options),async(result,writer)=>{
  const entity=await arkivClient().getEntity(result.entityKey,Requests);verifyMetadata(entity,result,writer);if(entity.schemaVersion.value!=="2")throw new ProviderError("Arkiv","Intent schema version does not match.","READBACK_MISMATCH");
  if(!matchesPublicIntent(entity,intent,{writer,entityKey:result.entityKey,expiresAtBlock:result.expiresAt.toString()}))throw new ProviderError("Arkiv","Published intent version or commitment differs from the approved projection.","READBACK_MISMATCH");
  return {entityKey:result.entityKey,transactionHash:result.txHash,writer,expiresAtBlock:result.expiresAt.toString(),confirmed:true,entity};
 });
}

export const Evidence = defineSchema("perenna.evidence.v2", { evidenceDigest:str().indexed(), subjectCommitment:str().indexed(), issuer:addr().indexed(), role:str().indexed(), outcome:str(), simulated:bool(), expiresMs:u64().indexed(), signature:bytes(), referenceCommitment:str(), schemaVersion:str() });
const evidenceProjection = z.object({evidenceDigest:z.string().regex(/^0x[0-9a-fA-F]{64}$/),subjectCommitment:z.string().regex(/^0x[0-9a-fA-F]{64}$/),issuer:z.string().regex(/^0x[0-9a-fA-F]{40}$/),role:z.enum(["buyer","supplier","reviewer"]),outcome:z.enum(["received","fulfilled","late","disputed","cancelled"]),simulated:z.boolean(),expiresMs:z.number().int().positive(),signature:z.string().regex(/^0x[0-9a-fA-F]{130}$/),referenceCommitment:z.string().regex(/^0x[0-9a-fA-F]{64}$/)}).strict();
export async function prepareEvidencePublication(projection:unknown){
 const record=evidenceProjection.parse(projection);if(record.expiresMs<=Date.now())throw new ProviderError("Arkiv","Evidence has already expired.","INVALID_EVIDENCE");
 const values={...record,issuer:addr(record.issuer as Address),expiresMs:u64(BigInt(record.expiresMs)),signature:new Uint8Array(Buffer.from(record.signature.slice(2),"hex")),schemaVersion:"2"};
 return quoteCreate({kind:"evidence",...record},record.expiresMs,(wallet,options)=>wallet.createEntity(Evidence,values,options));
}
export async function publishEvidence(projection:unknown,authorization:WriteAuthorization){
 requireEnabled("Arkiv","ARKIV_WRITES_ENABLED");const record=evidenceProjection.parse(projection);
 if(record.expiresMs<=Date.now())throw new ProviderError("Arkiv","Evidence has already expired.","INVALID_EVIDENCE");
 const values={...record,issuer:addr(record.issuer as Address),expiresMs:u64(BigInt(record.expiresMs)),signature:new Uint8Array(Buffer.from(record.signature.slice(2),"hex")),schemaVersion:"2"};
 return guardedCreate({kind:"evidence",...record},record.expiresMs,authorization,(wallet,options)=>wallet.createEntity(Evidence,values,options),async(result,writer)=>{
  const saved=await arkivClient().getEntity(result.entityKey,Evidence);verifyMetadata(saved,result,writer);if(saved.schemaVersion.value!=="2")throw new ProviderError("Arkiv","Evidence schema version does not match.","READBACK_MISMATCH");
  for(const [name,value] of Object.entries(record)){const expected=typeof value==="number"?BigInt(value):value;const actual=(saved as any)[name]?.value;if(typeof expected==="string"&&expected.startsWith("0x")?typeof actual!=="string"||actual.toLowerCase()!==expected.toLowerCase():actual!==expected)throw new ProviderError("Arkiv","Evidence readback differs from the approved signed projection.","READBACK_MISMATCH");}
  return {entityKey:result.entityKey,transactionHash:result.txHash,writer,confirmed:true,expiresAtBlock:result.expiresAt.toString(),evidenceDigest:record.evidenceDigest};
 });
}

export async function discoverEvidence(expectedWriter:Address,subjectCommitment:string){
 if(!isAddress(expectedWriter)||!/^0x[0-9a-fA-F]{64}$/.test(subjectCommitment))throw new ProviderError("Arkiv","Expected writer and subject commitment are required.","INVALID_QUERY");
 try{return await arkivClient().select().from(Evidence).where(and(eq("$creator",addr(expectedWriter)),eq("subjectCommitment",subjectCommitment),gt("expiresMs",u64(BigInt(Date.now()))))).limit(100).fetch();}
 catch{throw new ProviderError("Arkiv","Signed evidence retrieval failed.");}
}

export async function reconcileIntentPublication(projection:unknown){
 const intent=publicIntentSchema.parse(projection);const {reconcileArkivCreate}=await import('./arkiv-reconciliation');
 return reconcileArkivCreate({kind:'intent',...intent},(wallet,options)=>wallet.createEntity(Requests,intentValues(intent),options),async(result,writer)=>{
  const entity=await arkivClient().getEntity(result.entityKey,Requests);verifyMetadata(entity,result,writer);
  if(entity.schemaVersion.value!=='2'||!Object.entries(intent).every(([name,value])=>typeof value==='number'?BigInt(rowValue(entity,name))===BigInt(value):rowValue(entity,name)===value))throw new ProviderError('Arkiv','Recovered request content differs from the frozen projection.','READBACK_MISMATCH');
 });
}
export async function reconcileEvidencePublication(projection:unknown){
 const record=evidenceProjection.parse(projection);const {reconcileArkivCreate}=await import('./arkiv-reconciliation');
 const values={...record,issuer:addr(record.issuer as Address),expiresMs:u64(BigInt(record.expiresMs)),signature:new Uint8Array(Buffer.from(record.signature.slice(2),'hex')),schemaVersion:'2'};
 return reconcileArkivCreate({kind:'evidence',...record},(wallet,options)=>wallet.createEntity(Evidence,values,options),async(result,writer)=>{
  const entity=await arkivClient().getEntity(result.entityKey,Evidence);verifyMetadata(entity,result,writer);
  if(entity.schemaVersion.value!=='2'||!Object.entries(record).every(([name,value])=>{const actual=rowValue(entity,name);return typeof value==='number'?BigInt(actual)===BigInt(value):typeof value==='string'&&value.startsWith('0x')?String(actual).toLowerCase()===value.toLowerCase():actual===value;}))throw new ProviderError('Arkiv','Recovered evidence content differs from the frozen projection.','READBACK_MISMATCH');
 });
}
