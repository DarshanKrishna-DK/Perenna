import {beforeEach,afterEach,describe,expect,it,vi} from 'vitest';
const rpc=vi.hoisted(()=>({getChainId:vi.fn(),getTransaction:vi.fn(),getTransactionReceipt:vi.fn()}));
vi.mock('viem',async(original)=>({...await original<any>(),createPublicClient:()=>rpc}));
import {verifyOperatingTransfer} from '../src/providers/funds';
const hash=('0x'+'aa'.repeat(32)) as `0x${string}`,from='0x1111111111111111111111111111111111111111',to='0x2222222222222222222222222222222222222222';
const expected={from,to,sourceAccountId:'0.0.1',recipientAccountId:'0.0.2',amountAtomic:'100',notBeforeMs:100000} as const;
beforeEach(()=>{vi.clearAllMocks();rpc.getChainId.mockResolvedValue(296);rpc.getTransaction.mockResolvedValue({chainId:296,from,to,input:'0x',value:1000000000000n});rpc.getTransactionReceipt.mockResolvedValue({status:'success',transactionHash:hash});vi.stubGlobal('fetch',vi.fn(async(url)=>String(url).includes('/contracts/results/')?Response.json({hash,timestamp:'200.123',result:'SUCCESS',status:1,from,to,amount:100,chain_id:'0x128'}):Response.json({transactions:[{result:'SUCCESS',consensus_timestamp:'200.123',transaction_id:'0.0.1-200-1',charged_tx_fee:15,transfers:[{account:'0.0.1',amount:-115},{account:'0.0.2',amount:100}]}]})));});
afterEach(()=>vi.unstubAllGlobals());
describe('exact operating wallet transfer proof',()=>{
 it('matches EVM relay value and native receipt while attributing actual network charge',async()=>{expect(await verifyOperatingTransfer(hash,expected)).toMatchObject({confirmed:true,transactionId:'0.0.1-200-1',networkCharge:{amountAtomic:'15',charges:[{feePayer:'0.0.1'}]}});});
 it.each([{chainId:1},{from:to},{to:from},{value:100n},{input:'0x1234'}])('rejects wrong network, sender, recipient, unit or nontransfer data: %s',async(changed)=>{rpc.getTransaction.mockResolvedValue({chainId:296,from,to,input:'0x',value:1000000000000n,...changed});await expect(verifyOperatingTransfer(hash,expected)).rejects.toMatchObject({code:'TOPUP_UNVERIFIED'});});
 it('rejects an EVM receipt without native recipient credit',async()=>{vi.stubGlobal('fetch',vi.fn(async(url)=>String(url).includes('/contracts/results/')?Response.json({hash,timestamp:'200.123'}):Response.json({transactions:[{result:'SUCCESS',consensus_timestamp:'200.123',transaction_id:'0.0.1-200-1',transfers:[{account:'0.0.1',amount:-100},{account:'0.0.9',amount:100}]}]})));await expect(verifyOperatingTransfer(hash,expected)).rejects.toMatchObject({code:'TOPUP_UNVERIFIED'});});
});


describe('observed Hedera top-up Mirror encoding',()=>{
 const actualHash='0x16cf9611b7afef46b22442445d5da2a6080526554a961919751e481e72cfed6f' as const;
 const f='0x6369c357d8d1e6a47361cbd85a7dc641fc7efb3b' as const,o='0x8e63d8120dcfaf9ef0050ba1b8c2991ccdfd773e' as const;
 const reviewed={from:f,to:o,sourceAccountId:'0.0.11332984',recipientAccountId:'0.0.11332965',amountAtomic:'30000000',notBeforeMs:1793930600000};
 function fixture(change:Record<string,unknown>={}){rpc.getTransaction.mockResolvedValue({chainId:296,from:f,to:o,input:'0x',value:300000000000000000n});rpc.getTransactionReceipt.mockResolvedValue({status:'success',transactionHash:actualHash});vi.stubGlobal('fetch',vi.fn(async(url)=>String(url).includes('/contracts/results/')?Response.json({hash:actualHash,timestamp:'1793930654.509187460',result:'SUCCESS',status:'0x1',from:'0x0000000000000000000000000000000000aced78',to:o,amount:30000000,chain_id:'0x128',...change}):Response.json({transactions:[{result:'SUCCESS',consensus_timestamp:'1793930654.509187460',transaction_id:'0.0.11332984-1793930654-1',charged_tx_fee:15,transfers:[{account:'0.0.11332984',amount:-30000015},{account:'0.0.11332965',amount:30000000}]}]})));}
 it('accepts documented hexadecimalsuccess and strict longzeroaddress equivalence for reviewed nativeID',async()=>{fixture();expect(await verifyOperatingTransfer(actualHash,reviewed)).toMatchObject({confirmed:true,transactionHash:actualHash});});
 it.each([{status:'0x0'},{from:'0x0000000000000000000000000000000000aced77'},{to:'0x0000000000000000000000000000000000aced78'},{hash:'0x'+'00'.repeat(32)},{amount:30000001},{chain_id:'0x127'}])('rejects wrong status, nativeidentity, receipt hash, amount or chain: %s',async(change)=>{fixture(change);await expect(verifyOperatingTransfer(actualHash,reviewed)).rejects.toMatchObject({code:'TOPUP_UNVERIFIED'});});
 it('cannot use a matching numeric address against another reviewed native accountID',async()=>{fixture();await expect(verifyOperatingTransfer(actualHash,{...reviewed,sourceAccountId:'0.0.11332983'})).rejects.toMatchObject({code:'TOPUP_UNVERIFIED'});});
});
