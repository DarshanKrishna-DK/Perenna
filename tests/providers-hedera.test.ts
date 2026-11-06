import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
const mocks=vi.hoisted(()=>({verify:vi.fn(),settle:vi.fn(),supported:vi.fn(),inspect:vi.fn()}));
vi.mock('@x402/core/server',()=>({HTTPFacilitatorClient:class{verify=mocks.verify;settle=mocks.settle;getSupported=mocks.supported;}}));
vi.mock('@x402/hedera',async(importOriginal)=>({...await importOriginal<any>(),inspectHederaTransaction:mocks.inspect}));
import {AccountId,Hbar,TransactionId,TransferTransaction} from '@hiero-ledger/sdk';
import {facilitatorCapabilities,reconcileHederaTransaction,settleProtectedRequest} from '../src/providers/hedera';
const requirements={scheme:'exact',network:'hedera:testnet' as const,asset:'0.0.0',amount:'100',payTo:'0.0.2',maxTimeoutSeconds:60,extra:{feePayer:"0.0.99"}};
const policy={payer:'0.0.1',payee:'0.0.2',asset:'0.0.0',maxAmount:'100',expiresAt:Date.now()+60000,resourceUrl:'http://localhost/api/resource',policyVersion:'1',maxNetworkFeeAtomic:'0',maxTransactionFeeAtomic:'200000000',networkFeePayer:'facilitator' as const,facilitator:'https://x402.org/facilitator' as const};
const encodedTransfer=new TransferTransaction().addHbarTransfer('0.0.1',Hbar.fromTinybars(-100)).addHbarTransfer('0.0.2',Hbar.fromTinybars(100)).setNodeAccountIds([AccountId.fromString('0.0.3')]).setTransactionId(TransactionId.generate('0.0.99')).setMaxTransactionFee(Hbar.fromTinybars(100000000)).freeze();
const payload:any={x402Version:2,resource:{url:policy.resourceUrl},accepted:requirements,payload:{transaction:Buffer.from(encodedTransfer.toBytes()).toString('base64')}};
const layout={hasNonTransferOperations:false,hbarTransfers:[{accountId:'0.0.1',amount:'-100'},{accountId:'0.0.2',amount:'100'}],tokenTransfers:{}};
beforeEach(()=>{vi.stubEnv('HEDERA_PAYMENTS_ENABLED','true');vi.clearAllMocks();mocks.inspect.mockReturnValue(layout);mocks.verify.mockResolvedValue({isValid:true});mocks.settle.mockResolvedValue({success:true,transaction:'0.0.1@123.456'});});
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
describe('Hedera protected settlement boundaries',()=>{
 it('does not submit during facilitator outage or rejected verification',async()=>{
  mocks.supported.mockRejectedValue(new Error('offline'));await expect(facilitatorCapabilities()).rejects.toThrow();
  mocks.verify.mockRejectedValueOnce(new Error('offline'));await expect(settleProtectedRequest(payload,requirements,policy)).rejects.toThrow();expect(mocks.settle).not.toHaveBeenCalled();
  mocks.verify.mockResolvedValue({isValid:false});await expect(settleProtectedRequest(payload,requirements,policy)).rejects.toMatchObject({code:'PAYMENT_REJECTED'});expect(mocks.settle).not.toHaveBeenCalled();
 });
 it('preserves uncertain and unsuccessful settlement without retrying',async()=>{
  mocks.settle.mockRejectedValueOnce(new Error('timeout'));await expect(settleProtectedRequest(payload,requirements,policy)).rejects.toMatchObject({code:'OUTCOME_UNKNOWN'});expect(mocks.settle).toHaveBeenCalledTimes(1);
  mocks.settle.mockResolvedValue({success:false});await expect(settleProtectedRequest(payload,requirements,policy)).rejects.toMatchObject({code:'SETTLEMENT_UNCONFIRMED'});
 });
 it.each([{asset:'0.0.99'},{payTo:'0.0.3'},{network:'hedera:mainnet'}])('rejects changed terms before facilitator access: %j',async(change)=>{await expect(settleProtectedRequest(payload,{...requirements,...change} as any,policy)).rejects.toMatchObject({code:'POLICY_MISMATCH'});expect(mocks.verify).not.toHaveBeenCalled();});
 it('rejects wrong payer, extra assets and nontransfer operations',async()=>{
  for(const changed of [{...layout,hbarTransfers:[{accountId:'0.0.9',amount:'-100'},{accountId:'0.0.2',amount:'100'}]},{...layout,hasNonTransferOperations:true},{...layout,tokenTransfers:{'0.0.77':[{accountId:'0.0.1',amount:'-9'},{accountId:'0.0.3',amount:'9'}]}}]){mocks.inspect.mockReturnValue(changed);await expect(settleProtectedRequest(payload,requirements,policy)).rejects.toMatchObject({code:'POLICY_MISMATCH'});}expect(mocks.verify).not.toHaveBeenCalled();
 });
 it('requires exact receipt payer, recipient, asset and creation time',async()=>{
  vi.stubGlobal('fetch',vi.fn(async()=>Response.json({transactions:[{result:'SUCCESS',consensus_timestamp:'200.000',transfers:[{account:'0.0.1',amount:-100},{account:'0.0.2',amount:100}]}]})));
  const expected={payee:'0.0.2',payer:'0.0.1',asset:'0.0.0',amount:'100',notBeforeMs:100000};
  expect((await reconcileHederaTransaction('0.0.1@123.456',expected)).confirmed).toBe(true);
  for(const change of [{payer:'0.0.9'},{payee:'0.0.9'},{asset:'0.0.99'},{amount:'101'},{notBeforeMs:300000}])expect((await reconcileHederaTransaction('0.0.1@123.456',{...expected,...change})).confirmed).toBe(false);
 });
});

