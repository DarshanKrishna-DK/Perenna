import { createWalletClient } from '@arkiv-network/sdk';
import { rabdi } from '@arkiv-network/sdk/chains';
import { custom, decodeFunctionData, keccak256, MethodNotFoundRpcError, parseAbi, type Hex, type LocalAccount } from 'viem';
import { allInternal, db, get, put, transaction } from '../server/store';
import { digest } from '../domain/procurement';
import { isProviderError, ProviderError } from './config';

export const ARKIV_REGISTRY='0x4400000000000000000000000000000000000044';
const executeAbi=parseAbi(['function execute((uint8 operation,bytes operationData)[] ops) external returns(bytes32[] keys)']);
type Rpc={request(args:{method:string;params?:readonly unknown[]}):Promise<unknown>};
const fail=(message:string,code='WRITE_BLOCKED'):never=>{throw new ProviderError('Arkiv',message,code);};
export async function captureArkivCreate(account:LocalAccount,chain:ReturnType<typeof rabdi>,rpc:Rpc,prepare:(wallet:ReturnType<typeof createWalletClient>)=>Promise<unknown>){
 const stop=new Error('Captured unsigned request');let captured:{estimate:bigint;data:Hex}|undefined;
 const reads=new Set(['eth_chainId','eth_blockNumber','eth_getBlockByNumber','eth_getTransactionCount','eth_gasPrice','eth_maxPriorityFeePerGas','eth_estimateGas']);
 try{
  if(BigInt(await rpc.request({method:'eth_chainId'}) as string)!==7794095n)fail('Only Arkiv Rabdi is permitted.','NETWORK_MISMATCH');
  const transport=custom({async request(args){
   if(args.method==='eth_fillTransaction')throw new MethodNotFoundRpcError(new Error('Guarded estimate required'));
   if(!reads.has(args.method))fail('Unsigned preparation attempted an unsupported RPC method.');
   if(args.method!=='eth_estimateGas')return rpc.request(args);
   const input=args.params?.[0] as Record<string,unknown>|undefined;
   if(!input||String(input.from).toLowerCase()!==account.address.toLowerCase()||String(input.to).toLowerCase()!==ARKIV_REGISTRY||typeof input.data!=='string'||input.value!==undefined&&BigInt(input.value as string)!==0n)fail('Unsigned create fields do not match the writer.');
   const decoded=decodeFunctionData({abi:executeAbi,data:input!.data as Hex});
   if(decoded.functionName!=='execute'||decoded.args[0].length!==1||decoded.args[0][0].operation!==1)fail('Exactly one native create operation is required.');
   const result=await rpc.request({method:'eth_estimateGas',params:[input,'latest']});
   if(typeof result!=='string'||!/^0x[0-9a-f]+$/i.test(result)||BigInt(result)<=0n)fail('Unsigned estimation returned no positive gas estimate.');
   captured={estimate:BigInt(result as string),data:input!.data as Hex};throw stop;
  }},{retryCount:0});
  const unsigned={...account,signTransaction:async()=>fail('Signing is blocked during unsigned preparation.')};
  const wallet=createWalletClient({chain,account:unsigned,transport,cacheTime:0});
  try{await prepare(wallet);}catch(error){let cause:unknown=error;for(let depth=0;cause&&depth<32;depth++){if(cause===stop&&captured)return captured;cause=typeof cause==='object'?(cause as {cause?:unknown}).cause:undefined;}}
  return fail('Exact unsigned preparation or estimation failed.','ESTIMATE_FAILED');
 }catch(error){if(isProviderError(error))throw error;return fail('Exact unsigned preparation or estimation failed.','ESTIMATE_FAILED');}
}

const scope='arkiv-writer';
export function claimArkivWriter(writer:string,operation:unknown){
 db().exec('PRAGMA synchronous=FULL');
 return transaction(()=>{
  const id='arkiv-writer-'+writer.toLowerCase();const prior=get('arkiv_writer',scope,id);
  if(prior&&prior.status!=='idle')fail('This signer has an active or unresolved write. Reconcile its durable journal before any publication.','WRITER_LOCKED');
  const operationId='arkiv-operation-'+digest({writer:writer.toLowerCase(),operation});
  const previous=get('arkiv_operation',scope,operationId);
  if(previous&&previous.status!=='not_submitted')fail('This exact public operation already has a journal entry. Reconcile it without recreating.','OPERATION_EXISTS');
  put('arkiv_operation',scope,{id:operationId,writer,operation,status:'preflight'});
  put('arkiv_writer',scope,{id,writer,operationId,status:'busy'});
  return {writerId:id,operationId};
 });
}
export type ArkivWriterClaim=ReturnType<typeof claimArkivWriter>;
export function checkpointArkivWriter(claim:ArkivWriterClaim,status:string,details:Record<string,unknown>={}){
 return transaction(()=>{const writer=get('arkiv_writer',scope,claim.writerId),operation=get('arkiv_operation',scope,claim.operationId);if(!writer||!operation||writer.operationId!==claim.operationId||writer.status==='idle')fail('The durable signer lock changed.','WRITER_LOCKED');
 const saved=put('arkiv_operation',scope,{...operation,...details,status});
 put('arkiv_writer',scope,{...writer,status:['verified','not_submitted'].includes(status)?'idle':'busy'});return saved;});
}
export function reserveArkivFee(claim:ArkivWriterClaim,cost:bigint,totalCap:bigint,details:Record<string,unknown>){
 transaction(()=>{const exposure=allInternal('arkiv_operation').filter(op=>op.status!=='not_submitted'&&op.id!==claim.operationId).reduce((sum,op)=>sum+BigInt(op.reservedFeeWei??0),0n);
 if(cost<=0n||totalCap<=0n||exposure+cost>totalCap)fail('The cumulative authorized Arkiv writer fee allowance is exhausted.','BUDGET_EXCEEDED');
 const writer=get('arkiv_writer',scope,claim.writerId),operation=get('arkiv_operation',scope,claim.operationId);if(!writer||!operation||writer.operationId!==claim.operationId||operation.status!=='preflight')fail('The writer reservation changed.');
 put('arkiv_operation',scope,{...operation,...details,status:'prepared',reservedFeeWei:cost.toString()});});
}
export function captureArkivSignedHash(claim:ArkivWriterClaim,signedTransaction:Hex){const hash=keccak256(signedTransaction);checkpointArkivWriter(claim,'submitting',{transactionHash:hash,signedTransaction});return hash;}
export function failArkivWriter(claim:ArkivWriterClaim){const current=get('arkiv_operation',scope,claim.operationId);if(current?.status==='verified')return;checkpointArkivWriter(claim,current?.transactionHash?'unknown':'not_submitted');}

/** Internal recovery access. Never return this journal, which contains signed bytes, through an API. */
export function arkivOperation(writer:string,operation:unknown){return get('arkiv_operation',scope,'arkiv-operation-'+digest({writer:writer.toLowerCase(),operation}));}
export function hasArkivOperation(operation:unknown){const fingerprint=digest(operation);return allInternal('arkiv_operation').some(record=>digest(record.operation)===fingerprint);}
export function finishArkivReconciliation(writer:string,operation:unknown,status:'verified'|'reverted',details:Record<string,unknown>){
 return transaction(()=>{const current=arkivOperation(writer,operation);if(!current||digest(current.operation)!==digest(operation))fail('The frozen publication operation changed.','READBACK_MISMATCH');
 const saved=put('arkiv_operation',scope,{...current,...details,status});const id='arkiv-writer-'+writer.toLowerCase();const lock=get('arkiv_writer',scope,id);
 if(lock?.operationId===current!.id)put('arkiv_writer',scope,{...lock,status:'idle'});return saved;});
}

