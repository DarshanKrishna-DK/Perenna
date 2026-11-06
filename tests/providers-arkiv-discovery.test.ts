import {beforeEach,describe,expect,it,vi} from 'vitest';
const mock=vi.hoisted(()=>({fetch:vi.fn(),head:vi.fn(),chain:vi.fn()}));
vi.mock('@arkiv-network/sdk',async(original)=>{const actual=await original<any>();const query:any={from:()=>query,where:()=>query,limit:()=>query,fetch:mock.fetch};return {...actual,createPublicClient:()=>({select:()=>query,getBlockNumber:mock.head,getChainId:mock.chain})};});
import {discoverIntents,type PublicIntent} from '../src/providers/arkiv';
const writer='0x1111111111111111111111111111111111111111',key=('0x'+'22'.repeat(32)) as `0x${string}`;
const projection:PublicIntent={item:'coffee',unit:'kg',quantity:5,area:'Mumbai',requestExpiresMs:Date.now()+86400000,deliveryDeadlineMs:Date.now()+172800000,deliveryTimezone:'Asia/Kolkata',requestVersion:2,policyVersion:1,createdMs:Date.now()-1000,businessCommitment:'0x'+'33'.repeat(32),requestCommitment:'0x'+'44'.repeat(32)};
beforeEach(()=>{process.env.ARKIV_ACCESS_KEY='fixture';mock.chain.mockResolvedValue(7794095);mock.head.mockResolvedValue(100n);mock.fetch.mockResolvedValue({entities:[{...Object.fromEntries(Object.entries(projection).map(([name,value])=>[name,{value:typeof value==='number'?BigInt(value):value}])),schemaVersion:{value:'2'},$key:key,$creator:writer,$owner:writer,$expiresAt:101n,$creationFlags:{readonly:true,permissionlessExtension:false}}]});});
describe('Arkiv block expiration during current-row discovery',()=>{
 it('checks confirmed block expiry against fresh chain head after query',async()=>{expect((await discoverIntents(writer,'Mumbai',{projection,entityKey:key,expiresAtBlock:'101'})).entities).toHaveLength(1);expect(mock.head).toHaveBeenCalledWith({cacheTime:0});});
 it('rejects block-expired entities even with a future application deadline',async()=>{mock.head.mockResolvedValue(101n);await expect(discoverIntents(writer,'Mumbai',{projection,entityKey:key,expiresAtBlock:'101'})).rejects.toMatchObject({code:'ENTITY_EXPIRED'});});
});
