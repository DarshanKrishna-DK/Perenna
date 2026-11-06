import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {randomUUID} from 'node:crypto';
import {privateKeyToAccount} from 'viem/accounts';
import {decodeAbiParameters,decodeFunctionData,encodeAbiParameters,encodeEventTopics,keccak256,parseAbi,parseAbiParameters,parseTransaction,type Hex} from 'viem';
import {ENTITY_EVENTS_ABI} from '@arkiv-network/sdk/entity';
const mocks=vi.hoisted(()=>({rpc:{getChainId:vi.fn(),getBlock:vi.fn(),getTransactionCount:vi.fn(),getGasPrice:vi.fn(),getBalance:vi.fn(),estimateGas:vi.fn(),sendRawTransaction:vi.fn(),waitForTransactionReceipt:vi.fn(),getTransaction:vi.fn()},getEntity:vi.fn()}));
vi.mock('viem',async(original)=>({...await original<any>(),createPublicClient:()=>mocks.rpc}));
vi.mock('@arkiv-network/sdk',async(original)=>({...await original<any>(),createPublicClient:()=>({getEntity:mocks.getEntity})}));
import {prepareIntentPublication,prepareEvidencePublication,publishIntent} from '../src/providers/arkiv';
import {allInternal,get} from '../src/server/store';
const privateKey=('0x'+'88'.repeat(32)) as Hex;const account=privateKeyToAccount(privateKey);const registry='0x4400000000000000000000000000000000000044';const hash=('0x'+'aa'.repeat(32)) as Hex;const entityKey=('0x'+'bb'.repeat(32)) as Hex;
const abi=parseAbi(['function execute((uint8 operation,bytes operationData)[] ops) external returns(bytes32[] keys)']);
const createParams=parseAbiParameters('(uint128 salt,uint64 expiresAt,uint64 minLifetime,uint8 creationFlags,(bytes32 name,uint8 typeId,bytes value)[] attributes)');
let frozen:any,txHash:Hex,expiresAt:bigint,activeIntent:any;
function newIntent(){activeIntent={requestVersion:1,policyVersion:1,createdMs:Date.now()-1000,businessCommitment:'0x'+'11'.repeat(32),requestCommitment:'0x'+randomUUID().replaceAll('-','').repeat(2),item:'coffee',unit:'kg',quantity:5,area:'Mumbai',requestExpiresMs:Date.now()+60000,deliveryDeadlineMs:Date.now()+172800000,deliveryTimezone:'Asia/Kolkata'};return activeIntent;}
beforeEach(()=>{
 vi.clearAllMocks();process.env.PERENNA_DB_PATH=':memory:';
 for(const [name,value] of Object.entries({ARKIV_WRITES_ENABLED:'true',ARKIV_EXCLUSIVE_WRITER:'true',ARKIV_PRIVATE_KEY:privateKey,ARKIV_WRITER_ADDRESS:account.address,ARKIV_ACCESS_KEY:'fixture-not-live',ARKIV_MAX_TOTAL_FEE_WEI:'100000000'}))vi.stubEnv(name,value);
 mocks.rpc.getChainId.mockResolvedValue(7794095);mocks.rpc.getBlock.mockResolvedValue({number:100n,gasLimit:30000000n,hash});mocks.rpc.getTransactionCount.mockResolvedValue(0);mocks.rpc.getGasPrice.mockResolvedValue(1n);mocks.rpc.getBalance.mockResolvedValue(100000000n);mocks.rpc.estimateGas.mockResolvedValue(400000n);
 vi.stubGlobal('fetch',vi.fn(async(_url,init)=>{const input=JSON.parse(init.body);let result:any;if(input.method==='eth_chainId')result='0x76edaf';else if(input.method==='eth_blockNumber')result='0x64';else if(input.method==='eth_estimateGas')result='0x61a80';else throw new Error('Unexpected fixture method');return Response.json({jsonrpc:'2.0',id:input.id,result});}));
 mocks.rpc.sendRawTransaction.mockImplementation(async({serializedTransaction})=>{txHash=keccak256(serializedTransaction);frozen=parseTransaction(serializedTransaction);const journal=allInternal('arkiv_operation').find(op=>op.transactionHash===txHash);expect(journal).toMatchObject({status:'submitting',signedTransaction:serializedTransaction});const decoded=decodeFunctionData({abi,data:frozen.data});expiresAt=decodeAbiParameters(createParams,decoded.args![0][0].operationData)[0].expiresAt;return txHash;});
 mocks.rpc.waitForTransactionReceipt.mockImplementation(async()=>({status:'success',transactionHash:txHash,from:account.address,to:registry,blockNumber:100n,blockHash:hash,logs:[{address:registry,topics:encodeEventTopics({abi:ENTITY_EVENTS_ABI,eventName:'EntityCreated',args:{entityKey,owner:account.address}}),data:encodeAbiParameters(parseAbiParameters('uint64,uint8'),[expiresAt,1])}]}));
 mocks.rpc.getTransaction.mockImplementation(async()=>({from:account.address,to:registry,input:frozen.data,value:0n,chainId:7794095,nonce:0,gas:1000000n,gasPrice:1n}));
 mocks.getEntity.mockImplementation(async()=>({...Object.fromEntries(Object.entries(activeIntent).map(([name,value])=>[name,{value:typeof value==='number'?BigInt(value):value}])),schemaVersion:{value:'2'},$key:entityKey,$creator:account.address,$owner:account.address,$expiresAt:expiresAt,$creationFlags:{readonly:true,permissionlessExtension:false}}));
});
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
describe('Arkiv publication admission and reconciliation boundary',()=>{
 it('prepares exact read-only fee scope with writes disabled and no private key',async()=>{
  vi.stubEnv('ARKIV_WRITES_ENABLED','false');vi.stubEnv('ARKIV_EXCLUSIVE_WRITER','false');vi.stubEnv('ARKIV_PRIVATE_KEY','');const before=allInternal('arkiv_operation').length;
  const quote=await prepareIntentPublication(newIntent());expect(quote).toMatchObject({signed:false,submitted:false,snapshotOnly:true,maximumFeeWei:'1000000',balanceSufficient:true,nonceClear:true});expect(quote.unsignedTransaction.data.startsWith('0x')).toBe(true);expect(mocks.rpc.sendRawTransaction).not.toHaveBeenCalled();expect(allInternal('arkiv_operation')).toHaveLength(before);
 });
 it('encodes a full 65byte evidence signature as bytes in the unsigned v2 schema',async()=>{
  vi.stubEnv('ARKIV_WRITES_ENABLED','false');vi.stubEnv('ARKIV_PRIVATE_KEY','');const quote=await prepareEvidencePublication({evidenceDigest:'0x'+'11'.repeat(32),subjectCommitment:'0x'+'22'.repeat(32),issuer:account.address,role:'buyer',outcome:'received',simulated:true,expiresMs:Date.now()+60000,signature:'0x'+'33'.repeat(65),referenceCommitment:'0x'+'44'.repeat(32)});expect(quote.signed).toBe(false);expect(quote.estimateGas).toBe('400000');expect(mocks.rpc.sendRawTransaction).not.toHaveBeenCalled();
 });
 it('uses current exact estimate, captures signed hash before broadcast, authenticates receipt and verifies readback',async()=>{
  const result=await publishIntent(newIntent(),{estimatedGas:1n,maxFeeWei:1000000n});expect(result.confirmed).toBe(true);expect(expiresAt).toBeGreaterThan(100n);expect(expiresAt).toBeLessThanOrEqual(131n);expect(mocks.rpc.estimateGas).toHaveBeenCalledWith(expect.objectContaining({blockTag:'latest',data:frozen.data}));expect(mocks.rpc.sendRawTransaction).toHaveBeenCalledTimes(1);const operation=allInternal('arkiv_operation').find(op=>op.transactionHash===txHash)!;expect(operation).toMatchObject({status:'verified',receiptConfirmed:true});expect(get('arkiv_writer','arkiv-writer','arkiv-writer-'+account.address.toLowerCase())?.status).toBe('idle');
 });
 it('blocks a pending nonce before any signature or broadcast',async()=>{
  mocks.rpc.getTransactionCount.mockImplementation(async({blockTag})=>blockTag==='pending'?1:0);await expect(publishIntent(newIntent(),{maxFeeWei:1000000n})).rejects.toMatchObject({code:'PREFLIGHT_FAILED'});expect(mocks.rpc.sendRawTransaction).not.toHaveBeenCalled();
 });
 it('retains known hash and blocks every subsequent signer operation after uncertain submission',async()=>{
  mocks.rpc.sendRawTransaction.mockImplementationOnce(async({serializedTransaction})=>{txHash=keccak256(serializedTransaction);expect(allInternal('arkiv_operation').some(op=>op.transactionHash===txHash)).toBe(true);throw new Error('provider transport failed with secret URL');});
  await expect(publishIntent(newIntent(),{maxFeeWei:1000000n})).rejects.toMatchObject({code:'WRITE_UNVERIFIED'});expect(allInternal('arkiv_operation').find(op=>op.transactionHash===txHash)?.status).toBe('unknown');await expect(publishIntent(newIntent(),{maxFeeWei:1000000n})).rejects.toMatchObject({code:'WRITER_LOCKED'});expect(mocks.rpc.sendRawTransaction).toHaveBeenCalledTimes(1);
 });
});
