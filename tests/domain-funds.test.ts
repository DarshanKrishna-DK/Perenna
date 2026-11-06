import {beforeAll,describe,expect,it,vi} from 'vitest';
import {randomUUID} from 'node:crypto';
import {privateKeyToAccount} from 'viem/accounts';
const providers=vi.hoisted(()=>({wallet:vi.fn(),resolve:vi.fn(),verify:vi.fn()}));
vi.mock('../src/providers/funds',()=>({readNativeWallet:providers.wallet,resolveNativeAccount:providers.resolve,verifyOperatingTransfer:providers.verify,readNetworkCharge:async()=>({status:'unknown',amountAtomic:null})}));
import {authorizeOperatingTopUp,confirmOperatingTopUp,fundsStatus,requestOperatingTopUp} from '../src/server/funds';
import {get,put} from '../src/server/store';
const signer=privateKeyToAccount(('0x'+'77'.repeat(32)) as `0x${string}`);
const tenant='funds-'+randomUUID(),source=signer.address,recipient='0x2222222222222222222222222222222222222222',hash='0x'+'aa'.repeat(32);
beforeAll(()=>{process.env.PERENNA_DB_PATH=':memory:';process.env.HEDERA_ACCOUNT_ID='0.0.10';process.env.HEDERA_OPERATING_ACCOUNT_ID='0.0.20';process.env.HEDERA_FEE_ACCOUNT_ID='0.0.30';process.env.HEDERA_MAX_TOTAL_TINYBAR='1000000';put('settings',tenant,{id:tenant+'-settings',policyVersion:1,operatingPerCallCapAtomic:'1000',operatingDailyCapAtomic:'5000'});put('service_payment',tenant,{id:randomUUID(),status:'unknown',amountAtomic:'600'});put('ledger',tenant,{id:randomUUID(),kind:'settled_service_fee_income',status:'confirmed',amountAtomic:'7'});providers.wallet.mockResolvedValue({status:'observed',amountAtomic:'500',consensusTimestamp:'100.0'});providers.resolve.mockImplementation(async(identity)=>identity===source?{accountId:'0.0.40',evmAddress:source}:{accountId:'0.0.20',evmAddress:recipient});});
describe('human-reviewed operating funding',()=>{
 it('separates wallet balances, uncertain commitments, settled income and unknown inference credit',async()=>{const status=await fundsStatus(tenant);expect(status.pendingCommitments.operatingAtomic).toBe('600');expect(status.settledFeeRevenueAtomic).toBe('7');expect(status.wallets.operating.amountAtomic).toBe('500');expect(status.inferenceCredits.status).toBe('unknown');});
 it('reviews shortfall and exact relay funding, preserves unknown hash, credits only exact confirmed unique receipt',async()=>{
  const review=await requestOperatingTopUp(tenant,{sourceEvmAddress:source,amountAtomic:'1200',requiredOperatingAtomic:'1000',revisedOperatingLimitAtomic:'2000'});expect(review.shortfallAtomic).toBe('1100');expect(review.unsignedTransaction).toMatchObject({from:source,to:recipient,value:'12000000000000',chainId:296});expect(get('settings',tenant,tenant+'-settings')?.operatingFundingLimitAtomic).toBeUndefined();
  await expect(confirmOperatingTopUp(tenant,review.id,hash)).rejects.toThrow('Sign the exact');
  const unrelated=privateKeyToAccount(('0x'+'55'.repeat(32)) as `0x${string}`);await expect(authorizeOperatingTopUp(tenant,review.id,await unrelated.signMessage({message:review.reviewMessage}))).rejects.toThrow('did not authorize');
  await authorizeOperatingTopUp(tenant,review.id,await signer.signMessage({message:review.reviewMessage}));
  providers.verify.mockRejectedValueOnce(new Error('unknown outcome'));await expect(confirmOperatingTopUp(tenant,review.id,hash)).rejects.toThrow('unknown');expect(get('operating_topup',tenant,review.id)).toMatchObject({status:'unknown',transactionHash:hash});expect(get('settings',tenant,tenant+'-settings')?.operatingFundingLimitAtomic).toBeUndefined();
  providers.verify.mockResolvedValue({confirmed:true,transactionId:'0.0.40-100-1',consensusTimestamp:'100.1',networkCharge:{status:'observed',amountAtomic:'2'}});expect((await confirmOperatingTopUp(tenant,review.id,hash)).status).toBe('confirmed');expect(get('settings',tenant,tenant+'-settings')).toMatchObject({operatingFundingLimitAtomic:'2000',operatingSessionCapAtomic:'2000',operatingPerCallCapAtomic:'1000',operatingDailyCapAtomic:'5000',policyVersion:2});await confirmOperatingTopUp(tenant,review.id,hash);expect(providers.verify).toHaveBeenCalledTimes(2);
  const other=await requestOperatingTopUp(tenant,{sourceEvmAddress:source,amountAtomic:'1200',requiredOperatingAtomic:'1000',revisedOperatingLimitAtomic:'2000'});await authorizeOperatingTopUp(tenant,other.id,await signer.signMessage({message:other.reviewMessage}));await expect(confirmOperatingTopUp(tenant,other.id,hash)).rejects.toThrow('another top-up');
 });
});
