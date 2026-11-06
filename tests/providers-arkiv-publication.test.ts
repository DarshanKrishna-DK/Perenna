import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {randomUUID} from 'node:crypto';
import {privateKeyToAccount} from 'viem/accounts';
import {decodeAbiParameters,decodeFunctionData,encodeAbiParameters,encodeEventTopics,keccak256,parseAbi,parseAbiParameters,parseTransaction,type Hex} from 'viem';
import {ENTITY_EVENTS_ABI} from '@arkiv-network/sdk/entity';
const mocks=vi.hoisted(()=>({rpc:{getChainId:vi.fn(),getBlock:vi.fn(),getTransactionCount:vi.fn(),getGasPrice:vi.fn(),getBalance:vi.fn(),estimateGas:vi.fn(),sendRawTransaction:vi.fn(),waitForTransactionReceipt:vi.fn(),getTransaction:vi.fn(),getTransactionReceipt:vi.fn(),getBlockNumber:vi.fn()},getEntity:vi.fn()}));
vi.mock('viem',async(original)=>({...await original<any>(),createPublicClient:()=>mocks.rpc}));
vi.mock('@arkiv-network/sdk',async(original)=>({...await original<any>(),createPublicClient:()=>({getEntity:mocks.getEntity})}));
import {prepareIntentPublication,prepareEvidencePublication,publishIntent,reconcileIntentPublication} from '../src/providers/arkiv';
import {allInternal,get,db,put} from '../src/server/store';
import { claimArkivWriter, checkpointArkivWriter } from '../src/providers/arkiv-writer';
import { createIntent,seedBusiness } from '../src/server/service';
import { intentPublicationProjection,publishPublicIntent } from '../src/server/intent-publication';
const privateKey=('0x'+'88'.repeat(32)) as Hex;const account=privateKeyToAccount(privateKey);const registry='0x4400000000000000000000000000000000000044';const hash=('0x'+'aa'.repeat(32)) as Hex;const entityKey=('0x'+'bb'.repeat(32)) as Hex;
const abi=parseAbi(['function execute((uint8 operation,bytes operationData)[] ops) external returns(bytes32[] keys)']);
const createParams=parseAbiParameters('(uint128 salt,uint64 expiresAt,uint64 minLifetime,uint8 creationFlags,(bytes32 name,uint8 typeId,bytes value)[] attributes)');
let frozen:any,txHash:Hex,expiresAt:bigint,activeIntent:any;
function newIntent(){activeIntent={requestVersion:1,policyVersion:1,createdMs:Date.now()-1000,businessCommitment:'0x'+'11'.repeat(32),requestCommitment:'0x'+randomUUID().replaceAll('-','').repeat(2),item:'coffee',unit:'kg',quantity:5,area:'Mumbai',requestExpiresMs:Date.now()+60000,deliveryDeadlineMs:Date.now()+172800000,deliveryTimezone:'Asia/Kolkata'};return activeIntent;}
beforeEach(()=>{
 vi.clearAllMocks();process.env.PERENNA_DB_PATH=':memory:';db().prepare("DELETE FROM records WHERE kind IN ('arkiv_operation','arkiv_writer')").run();
 for(const [name,value] of Object.entries({ARKIV_WRITES_ENABLED:'true',ARKIV_EXCLUSIVE_WRITER:'true',ARKIV_PRIVATE_KEY:privateKey,ARKIV_WRITER_ADDRESS:account.address,ARKIV_ACCESS_KEY:'fixture-not-live',ARKIV_MAX_TOTAL_FEE_WEI:'100000000'}))vi.stubEnv(name,value);
 mocks.rpc.getTransactionReceipt.mockImplementation((args)=>mocks.rpc.waitForTransactionReceipt(args));mocks.rpc.getBlockNumber.mockResolvedValue(100n);mocks.rpc.getChainId.mockResolvedValue(7794095);mocks.rpc.getBlock.mockResolvedValue({number:100n,gasLimit:30000000n,hash});mocks.rpc.getTransactionCount.mockResolvedValue(0);mocks.rpc.getGasPrice.mockResolvedValue(1n);mocks.rpc.getBalance.mockResolvedValue(100000000n);mocks.rpc.estimateGas.mockResolvedValue(400000n);
 vi.stubGlobal('fetch',vi.fn(async(_url,init)=>{const input=JSON.parse(init.body);let result:any;if(input.method==='eth_chainId')result='0x76edaf';else if(input.method==='eth_blockNumber')result='0x64';else if(input.method==='eth_estimateGas')result='0x61a80';else throw new Error('Unexpected fixture method');return Response.json({jsonrpc:'2.0',id:input.id,result});}));
 mocks.rpc.sendRawTransaction.mockImplementation(async({serializedTransaction})=>{txHash=keccak256(serializedTransaction);frozen=parseTransaction(serializedTransaction);const journal=allInternal('arkiv_operation').find(op=>op.transactionHash===txHash);expect(journal).toMatchObject({status:'submitting',signedTransaction:serializedTransaction});const decoded=decodeFunctionData({abi,data:frozen.data});expiresAt=decodeAbiParameters(createParams,decoded.args![0][0].operationData)[0].expiresAt;return txHash;});
 mocks.rpc.waitForTransactionReceipt.mockImplementation(async()=>({status:'success',transactionHash:txHash,from:account.address,to:registry,blockNumber:100n,blockHash:hash,logs:[{address:registry,topics:encodeEventTopics({abi:ENTITY_EVENTS_ABI,eventName:'EntityCreated',args:{entityKey,owner:account.address}}),data:encodeAbiParameters(parseAbiParameters('uint64,uint8'),[expiresAt,1])}]}));
 mocks.rpc.getTransaction.mockImplementation(async()=>({hash:txHash,blockHash:hash,blockNumber:100n,from:account.address,to:registry,input:frozen.data,value:0n,chainId:7794095,nonce:0,gas:1000000n,gasPrice:1n}));
 mocks.getEntity.mockImplementation(async()=>({...Object.fromEntries(Object.entries(activeIntent).map(([name,value])=>[name,{value:typeof value==='number'?BigInt(value):value}])),schemaVersion:{value:'2'},$key:entityKey,$creator:account.address,$owner:account.address,$expiresAt:expiresAt,$creationFlags:{readonly:true,permissionlessExtension:false}}));
});
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
describe('Arkiv publication admission and reconciliation boundary',()=>{
 it('recovers paused pre-admission publication and permits a fresh configured attempt without confusing missing receipts',async()=>{
  const tenant=randomUUID();seedBusiness(tenant,'Paused publisher');const intent=createIntent(tenant,{item:'coffee beans',unit:'kg',quantity:10,budgetMinor:100000,location:'Mumbai',deadline:new Date(Date.now()+604800000).toISOString()});activeIntent=intentPublicationProjection(tenant,intent);vi.stubEnv('ARKIV_MAX_FEE_WEI','1000000');vi.stubEnv('ARKIV_WRITES_ENABLED','false');
  await expect(publishPublicIntent(tenant,intent.id,1)).rejects.toMatchObject({code:'AUTHORIZATION_REQUIRED'});expect(get('intent',tenant,intent.id)).toMatchObject({publicationStatus:'unknown',pendingPublication:{projection:activeIntent}});expect(allInternal('arkiv_operation')).toHaveLength(0);
  vi.stubEnv('ARKIV_WRITES_ENABLED','true');await expect(publishPublicIntent(tenant,intent.id,1)).resolves.toMatchObject({publicationStatus:'not_published',publicationRecovery:{status:'not_submitted'}});expect(mocks.rpc.sendRawTransaction).not.toHaveBeenCalled();await expect(publishPublicIntent(tenant,intent.id,1)).resolves.toMatchObject({publicationStatus:'confirmed'});expect(mocks.rpc.sendRawTransaction).toHaveBeenCalledTimes(1);
 });
 it('proves an unadmitted operation absent without releasing a different active writer claim',async()=>{
  const projection=newIntent();const other=claimArkivWriter(account.address,{kind:'other-frozen-operation'});await expect(reconcileIntentPublication(projection)).resolves.toMatchObject({status:'not_submitted'});expect(get('arkiv_writer','arkiv-writer',other.writerId)).toMatchObject({status:'busy',operationId:other.operationId});expect(mocks.rpc.getTransactionReceipt).not.toHaveBeenCalled();expect(mocks.rpc.sendRawTransaction).not.toHaveBeenCalled();
 });
 it('recovers a missing-key admission failure after configuration without claiming a receipt was absent',async()=>{
  const projection=newIntent();vi.stubEnv('ARKIV_PRIVATE_KEY','');await expect(publishIntent(projection,{maxFeeWei:1000000n})).rejects.toMatchObject({code:'CONFIGURATION_REQUIRED'});await expect(reconcileIntentPublication(projection)).resolves.toMatchObject({status:'not_submitted'});expect(mocks.rpc.getTransactionReceipt).not.toHaveBeenCalled();
  vi.stubEnv('ARKIV_PRIVATE_KEY',privateKey);await expect(publishIntent(projection,{maxFeeWei:1000000n})).resolves.toMatchObject({confirmed:true});expect(mocks.rpc.sendRawTransaction).toHaveBeenCalledTimes(1);
 });
 it('never releases an old preflight claim from age alone and recognizes only proven unsubmitted work',async()=>{
  const projection=newIntent();const claim=claimArkivWriter(account.address,{kind:'intent',...projection});
  put('arkiv_operation','arkiv-writer',{...get('arkiv_operation','arkiv-writer',claim.operationId),createdAt:'2000-01-01T00:00:00.000Z'});
  await expect(reconcileIntentPublication(projection)).resolves.toMatchObject({status:'pending'});expect(get('arkiv_writer','arkiv-writer',claim.writerId)?.status).toBe('busy');expect(mocks.rpc.getTransactionReceipt).not.toHaveBeenCalled();
  checkpointArkivWriter(claim,'not_submitted');await expect(reconcileIntentPublication(projection)).resolves.toMatchObject({status:'not_submitted'});
 });
 it('recovers the exact original write after readback failure without signing or resending',async()=>{
  const projection=newIntent();mocks.getEntity.mockRejectedValueOnce(new Error('readback unavailable'));
  await expect(publishIntent(projection,{maxFeeWei:1000000n})).rejects.toMatchObject({code:'WRITE_UNVERIFIED'});
  vi.stubEnv('ARKIV_WRITES_ENABLED','false');vi.stubEnv('ARKIV_PRIVATE_KEY','');
  await expect(reconcileIntentPublication(projection)).resolves.toMatchObject({status:'confirmed',entityKey,transactionHash:txHash,expired:false});
  await expect(reconcileIntentPublication(projection)).resolves.toMatchObject({status:'confirmed'});
  expect(mocks.rpc.sendRawTransaction).toHaveBeenCalledTimes(1);expect(get('arkiv_writer','arkiv-writer','arkiv-writer-'+account.address.toLowerCase())?.status).toBe('idle');
  const newer=claimArkivWriter(account.address,{kind:'another-publication'});await reconcileIntentPublication(projection);expect(get('arkiv_writer','arkiv-writer',newer.writerId)).toMatchObject({status:'busy',operationId:newer.operationId});
 });
 it('does not turn an absent active entity into confirmed historical content',async()=>{
  const projection=newIntent();mocks.getEntity.mockRejectedValue(new Error('entity unavailable'));await expect(publishIntent(projection,{maxFeeWei:1000000n})).rejects.toThrow();await expect(reconcileIntentPublication(projection)).resolves.toMatchObject({status:'unknown',transactionHash:txHash});expect(get('arkiv_writer','arkiv-writer','arkiv-writer-'+account.address.toLowerCase())?.status).toBe('busy');
 });
 it('keeps an absent receipt unknown and the signer locked instead of inferring no submission',async()=>{
  const projection=newIntent();mocks.getEntity.mockRejectedValueOnce(new Error('readback unavailable'));await expect(publishIntent(projection,{maxFeeWei:1000000n})).rejects.toThrow();mocks.rpc.getTransactionReceipt.mockRejectedValueOnce(new Error('not found'));
  await expect(reconcileIntentPublication(projection)).resolves.toMatchObject({status:'unknown',transactionHash:txHash});expect(get('arkiv_writer','arkiv-writer','arkiv-writer-'+account.address.toLowerCase())?.status).toBe('busy');expect(mocks.rpc.sendRawTransaction).toHaveBeenCalledTimes(1);
 });
 it('authenticates historical expired readonly content from the original calldata and canonical creation',async()=>{
  const projection=newIntent();mocks.getEntity.mockRejectedValueOnce(new Error('readback unavailable'));await expect(publishIntent(projection,{maxFeeWei:1000000n})).rejects.toThrow();mocks.rpc.getBlockNumber.mockResolvedValue(expiresAt);mocks.getEntity.mockRejectedValue(new Error('expired entity absent'));
  await expect(reconcileIntentPublication(projection)).resolves.toMatchObject({status:'confirmed',expired:true});expect(mocks.getEntity).toHaveBeenCalledTimes(1);expect(mocks.rpc.sendRawTransaction).toHaveBeenCalledTimes(1);
 });
 it('rejects a noncanonical receipt and retains the unresolved writer claim',async()=>{
  const projection=newIntent();mocks.getEntity.mockRejectedValueOnce(new Error('readback unavailable'));await expect(publishIntent(projection,{maxFeeWei:1000000n})).rejects.toThrow();mocks.rpc.getBlock.mockResolvedValue({...await mocks.rpc.getBlock(),hash:entityKey});
  await expect(reconcileIntentPublication(projection)).rejects.toMatchObject({code:'READBACK_MISMATCH'});expect(get('arkiv_writer','arkiv-writer','arkiv-writer-'+account.address.toLowerCase())?.status).toBe('busy');
 });
 it('confirms an exact reverted transaction without resubmitting or reclaiming its consumed fee',async()=>{
  const projection=newIntent();mocks.getEntity.mockRejectedValueOnce(new Error('readback unavailable'));await expect(publishIntent(projection,{maxFeeWei:1000000n})).rejects.toThrow();const receipt=await mocks.rpc.waitForTransactionReceipt();mocks.rpc.getTransactionReceipt.mockResolvedValue({...receipt,status:'reverted',logs:[]});
  await expect(reconcileIntentPublication(projection)).resolves.toMatchObject({status:'reverted'});const journal=allInternal('arkiv_operation').find(op=>op.transactionHash===txHash)!;expect(journal.reservedFeeWei).toBe('1000000');expect(get('arkiv_writer','arkiv-writer','arkiv-writer-'+account.address.toLowerCase())?.status).toBe('idle');
 });
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
