import {beforeAll,describe,expect,it,vi} from 'vitest';
import {randomUUID} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {createWalletClient,ExpirationTime} from '@arkiv-network/sdk';
import {defineSchema,str} from '@arkiv-network/sdk/schema';
import {rabdi} from '@arkiv-network/sdk/chains';
import {privateKeyToAccount} from 'viem/accounts';
import {decodeFunctionData,keccak256,parseAbi,type Hex} from 'viem';
import {captureArkivCreate,captureArkivSignedHash,checkpointArkivWriter,claimArkivWriter,failArkivWriter,reserveArkivFee} from '../src/providers/arkiv-writer';
import {get} from '../src/server/store';
const account=privateKeyToAccount(('0x'+'44'.repeat(32)) as Hex);const schema=defineSchema('perenna.guard.test',{item:str()});
const executeAbi=parseAbi(['function execute((uint8 operation,bytes operationData)[] ops) external returns(bytes32[] keys)']);
let path:string;
beforeAll(()=>{path='.data/arkiv-writer-tests-'+randomUUID()+'.sqlite';process.env.PERENNA_DB_PATH=path;});
describe('guarded Arkiv unsigned capture',()=>{
 it('uses actual SDK1.0.1 encoder, pins estimate to latest, and never signs or broadcasts',async()=>{
  const methods:string[]=[];let estimateParams:any;const sign=vi.fn(async()=>{throw new Error('Original signer must never run');});
  const rpc={request:vi.fn(async(args:any)=>{methods.push(args.method);if(args.method==='eth_chainId')return '0x76edaf';if(args.method==='eth_blockNumber')return '0x64';if(args.method==='eth_estimateGas'){estimateParams=args.params;return '0x61a80';}throw new Error('Unexpected fixture RPC');})};
  const result=await captureArkivCreate({...account,signTransaction:sign},rabdi({accessKey:'fixture'}),rpc,wallet=>wallet.createEntity(schema,{item:'coffee'},{expiration:ExpirationTime.atBlock(200n),salt:7n,flags:{readonly:true,permissionlessExtension:false}}));
  expect(result.estimate).toBe(400000n);expect(estimateParams[1]).toBe('latest');expect(decodeFunctionData({abi:executeAbi,data:result.data}).functionName).toBe('execute');expect(sign).not.toHaveBeenCalled();expect(methods.some(method=>method.startsWith('eth_send'))).toBe(false);
 });
 it('fails closed and sanitizes failed exact estimates',async()=>{
  const rpc={request:vi.fn(async(args:any)=>{if(args.method==='eth_chainId')return '0x76edaf';if(args.method==='eth_blockNumber')return '0x64';throw new Error('https://secret-fixture-key.example/private');})};
  const result=captureArkivCreate(account,rabdi({accessKey:'fixture'}),rpc,wallet=>wallet.createEntity(schema,{item:'coffee'},{expiration:ExpirationTime.atBlock(200n),salt:7n}));
  await expect(result).rejects.toMatchObject({code:'ESTIMATE_FAILED'});await expect(result).rejects.not.toHaveProperty('cause');
 });
 it('rejects callbacks that swallow the estimate stop or skip estimation',async()=>{
  await expect(captureArkivCreate(account,rabdi({accessKey:'fixture'}),{request:async()=> '0x76edaf'},async()=>undefined)).rejects.toMatchObject({code:'ESTIMATE_FAILED'});
 });
});
describe('durable signer-wide write journal',()=>{
 it('serializes unrelated operations and releases only known unsubmitted work',()=>{
  const writer='0x'+'11'.repeat(20);const first=claimArkivWriter(writer,{intent:'first'});
  expect(()=>claimArkivWriter(writer,{intent:'second'})).toThrow('active or unresolved');
  failArkivWriter(first);expect(get('arkiv_operation','arkiv-writer',first.operationId)?.status).toBe('not_submitted');
  const second=claimArkivWriter(writer,{intent:'second'});checkpointArkivWriter(second,'not_submitted');
 });
 it('persists intent and signed hash before send admission and blocks every new write after unknown outcome',()=>{
  const writer='0x'+'22'.repeat(20);const claim=claimArkivWriter(writer,{intent:'uncertain'});reserveArkivFee(claim,100n,1000n,{intent:{nonce:1,to:'registry',data:'public-fixture'}});
  const raw='0xdeadbeef' as Hex;expect(captureArkivSignedHash(claim,raw)).toBe(keccak256(raw));failArkivWriter(claim);
  const separate=new DatabaseSync(path);const row=separate.prepare('SELECT body FROM records WHERE id=?').get(claim.operationId) as {body:string};const saved=JSON.parse(row.body);expect(saved.status).toBe('unknown');expect(saved.transactionHash).toBe(keccak256(raw));expect(saved.intent.nonce).toBe(1);separate.close();
  expect(()=>claimArkivWriter(writer,{intent:'different'})).toThrow('Reconcile');
 });
 it('retains receipt-confirmed identity when readback fails and counts unresolved fees globally',()=>{
  const claim=claimArkivWriter('0x'+'33'.repeat(20),{intent:'confirmed-unverified'});reserveArkivFee(claim,200n,1000n,{});captureArkivSignedHash(claim,'0xcafe');checkpointArkivWriter(claim,'receipt_confirmed',{entityKey:'0x'+'77'.repeat(32)});failArkivWriter(claim);
  expect(get('arkiv_operation','arkiv-writer',claim.operationId)?.entityKey).toBe('0x'+'77'.repeat(32));
  const next=claimArkivWriter('0x'+'55'.repeat(20),{intent:'budget'});expect(()=>reserveArkivFee(next,800n,1000n,{})).toThrow('cumulative');failArkivWriter(next);
 });
});
