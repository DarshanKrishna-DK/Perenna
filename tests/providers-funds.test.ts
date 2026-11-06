import {afterEach,describe,expect,it,vi} from 'vitest';
import {networkCharges,readNativeWallet} from '../src/providers/funds';
afterEach(()=>vi.unstubAllGlobals());
describe('observed Hedera funding data',()=>{
 it('returns observed balance with native timestamp and never invents zero for unavailable or unsafe values',async()=>{
  vi.stubGlobal('fetch',vi.fn(async()=>Response.json({account:'0.0.1',balance:{balance:123,timestamp:'100.000000001'}})));expect(await readNativeWallet('0.0.1')).toMatchObject({status:'observed',amountAtomic:'123',consensusTimestamp:'100.000000001'});
  vi.stubGlobal('fetch',vi.fn(async()=>{throw new Error('offline');}));expect(await readNativeWallet('0.0.1')).toMatchObject({status:'unknown',amountAtomic:null});
  vi.stubGlobal('fetch',vi.fn(async()=>Response.json({account:'0.0.1',balance:{balance:9007199254740992,timestamp:'100.0'}})));expect((await readNativeWallet('0.0.1')).status).toBe('unknown');
 });
 it('attributes actual charged fees to transaction fee payer and includes charged duplicates separately',()=>{
  const result=networkCharges([{charged_tx_fee:7,transaction_id:'0.0.99-100-1',consensus_timestamp:'100.1',result:'SUCCESS'},{charged_tx_fee:2,transaction_id:'0.0.99-100-1',consensus_timestamp:'100.2',result:'DUPLICATE_TRANSACTION'}]);expect(result.amountAtomic).toBe('9');expect(result.charges.map(c=>c.feePayer)).toEqual(['0.0.99','0.0.99']);expect(networkCharges([])).toMatchObject({status:'unknown',amountAtomic:null});
 });
});
