import { createPublicClient, decodeEventLog, http, isAddress, keccak256, parseTransaction, recoverTransactionAddress, type Address, type Hex } from 'viem';
import { toAccount } from 'viem/accounts';
import { createWalletClient, ExpirationTime, type CreateEntityOptions } from '@arkiv-network/sdk';
import { rabdi } from '@arkiv-network/sdk/chains';
import { ENTITY_EVENTS_ABI } from '@arkiv-network/sdk/entity';
import { digest } from '../domain/procurement';
import { ARKIV_REGISTRY, arkivOperation, hasArkivOperation, captureArkivCreate, finishArkivReconciliation } from './arkiv-writer';
import { ProviderError, secret } from './config';

export type ArkivReconciliation = {status:'confirmed'|'reverted'|'not_submitted'|'pending'|'unknown';entityKey?:Hex;transactionHash?:Hex;writer:Address;expiresAtBlock?:string;expired?:boolean;confirmed?:boolean};
type Prepare=(wallet:ReturnType<typeof createWalletClient>,options:CreateEntityOptions)=>Promise<unknown>;
const mismatch=():never=>{throw new ProviderError('Arkiv','The original publication journal or canonical receipt does not match the frozen public operation.','READBACK_MISMATCH');};

/** Read-only recovery. Preparation uses an in-memory RPC transport and can never sign or broadcast. */
export async function reconcileArkivCreate(operation:unknown,prepare:Prepare,verify:(result:{entityKey:Hex;txHash:Hex;expiresAt:bigint},writer:Address)=>Promise<unknown>):Promise<ArkivReconciliation>{
 const writer=secret('Arkiv','ARKIV_WRITER_ADDRESS') as Address;if(!isAddress(writer))mismatch();
 const journal=arkivOperation(writer,operation);const base={writer};
 // Every admitted broadcast first creates a durable operation and persists its signed hash.
 // Check all writer identities before using absence as affirmative non-admission evidence.
 // This does not release or modify any signer lock, including an unrelated active operation.
 if(!journal)return {...base,status:hasArkivOperation(operation)?'unknown':'not_submitted'};
 if(digest(journal.operation)!==digest(operation)||String(journal.writer).toLowerCase()!==writer.toLowerCase())mismatch();
 if(journal.status==='not_submitted'&&!journal.transactionHash&&!journal.signedTransaction)return {...base,status:'not_submitted'};
 // A preflight may still be executing in another process. Age alone never releases its claim.
 if(!journal.transactionHash)return {...base,status:'pending'};
 const hash=journal.transactionHash as Hex;const pending={...base,transactionHash:hash};
 try{
  if(!journal.signedTransaction||keccak256(journal.signedTransaction)!==hash||!journal.intent||!/^\d+$/.test(journal.expiresAt))mismatch();
  const frozen=journal.intent;const signed=parseTransaction(journal.signedTransaction);const signer=await recoverTransactionAddress({serializedTransaction:journal.signedTransaction});
  if(signer.toLowerCase()!==writer.toLowerCase()||signed.chainId!==7794095||signed.to?.toLowerCase()!==ARKIV_REGISTRY||(signed.value??0n)!==0n||signed.nonce!==frozen.nonce||signed.gas!==BigInt(frozen.gas)||signed.gasPrice!==BigInt(frozen.gasPrice)||signed.data?.toLowerCase()!==String(frozen.data).toLowerCase()||Number(frozen.chainId)!==7794095||String(frozen.to).toLowerCase()!==ARKIV_REGISTRY||BigInt(frozen.value)!==0n)mismatch();
  const refuse=async():Promise<never>=>mismatch();const account=toAccount({address:writer,signMessage:refuse,signTransaction:refuse,signTypedData:refuse});
  const captured=await captureArkivCreate(account,rabdi({accessKey:'local-reconciliation-encoding'}),{async request({method}){if(method==='eth_chainId')return '0x76edaf';if(method==='eth_blockNumber')return '0x0';if(method==='eth_estimateGas')return '0x1';throw new Error('Unsupported encoding read');}},wallet=>prepare(wallet,{expiration:ExpirationTime.atBlock(BigInt(journal.expiresAt)),salt:BigInt('0x'+digest(operation).slice(0,32)),flags:{readonly:true,permissionlessExtension:false}}));
  if(captured.data.toLowerCase()!==String(frozen.data).toLowerCase())mismatch();
  const rpc=createPublicClient({chain:rabdi({accessKey:secret('Arkiv','ARKIV_ACCESS_KEY')}),transport:http(undefined,{retryCount:0,timeout:15000,fetchOptions:{cache:'no-store',redirect:'error'}}),cacheTime:0});
  if(await rpc.getChainId()!==7794095)mismatch();
  const receipt=await rpc.getTransactionReceipt({hash});
  const [mined,canonical,head]=await Promise.all([rpc.getTransaction({hash}),rpc.getBlock({blockNumber:receipt.blockNumber}),rpc.getBlockNumber({cacheTime:0})]);
  if(receipt.transactionHash.toLowerCase()!==hash.toLowerCase()||receipt.from.toLowerCase()!==writer.toLowerCase()||receipt.to?.toLowerCase()!==ARKIV_REGISTRY||canonical.hash!==receipt.blockHash||mined.hash.toLowerCase()!==hash.toLowerCase()||mined.blockHash!==receipt.blockHash||mined.blockNumber!==receipt.blockNumber||mined.from.toLowerCase()!==writer.toLowerCase()||mined.to?.toLowerCase()!==ARKIV_REGISTRY||mined.input.toLowerCase()!==captured.data.toLowerCase()||mined.value!==0n||mined.chainId!==7794095||mined.nonce!==frozen.nonce||mined.gas!==BigInt(frozen.gas)||mined.gasPrice!==BigInt(frozen.gasPrice))mismatch();
  if(receipt.status==='reverted'){finishArkivReconciliation(writer,operation,'reverted',{receiptConfirmed:true,receiptBlock:receipt.blockNumber.toString(),reconciledAt:new Date().toISOString()});return {...pending,status:'reverted'};}
  if(receipt.status!=='success')mismatch();
  const events=receipt.logs.filter(log=>log.address.toLowerCase()===ARKIV_REGISTRY&&!log.removed).flatMap(log=>{try{const event=decodeEventLog({abi:ENTITY_EVENTS_ABI,data:log.data,topics:log.topics});return event.eventName==='EntityCreated'?[event.args]:[];}catch{return [];}});
  if(events.length!==1||events[0].owner.toLowerCase()!==writer.toLowerCase()||events[0].expiresAt!==BigInt(journal.expiresAt)||events[0].creationFlags!==1)mismatch();
  const result={entityKey:events[0].entityKey,txHash:hash,expiresAt:events[0].expiresAt};const expired=head>=result.expiresAt;
  // Expired readonly entities are absent from current RPC. Exact signed calldata plus canonical creation proves historical content.
  if(!expired)await verify(result,writer);
  finishArkivReconciliation(writer,operation,'verified',{entityKey:result.entityKey,receiptConfirmed:true,receiptBlock:receipt.blockNumber.toString(),verifiedAt:new Date().toISOString(),historicalExpired:expired});
  return {...pending,status:'confirmed',confirmed:true,entityKey:result.entityKey,expiresAtBlock:result.expiresAt.toString(),expired};
 }catch(error){if(error instanceof ProviderError&&error.code==='READBACK_MISMATCH')throw error;return {...pending,status:'unknown'};}
}
