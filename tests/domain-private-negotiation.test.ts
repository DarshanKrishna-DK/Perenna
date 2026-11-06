import {beforeEach, afterEach, describe, expect, it, vi} from 'vitest';
const mocks=vi.hoisted(()=>{process.env.PERENNA_DB_PATH=':memory:';return {offer:vi.fn()};});
vi.mock('../src/providers/private-inference',()=>({negotiatePrivateOffer:mocks.offer}));
import {db,get,list,put} from '../src/server/store';
import {controlIntent,createIntent,seedBusiness,settings} from '../src/server/service';
import {requestPrivateAgentReply} from '../src/server/private-negotiation';

const tenant='private-workspace';
const context={userId:'private-owner',sessionId:'private-session'};
const result={terms:{unitPriceMinor:2100,deliveryDays:2,summary:'Controlled supplier offer'},provider:'0G',requestId:'controlled-private-request',model:'fixture'};
function request(){const intent=createIntent(tenant,{item:'coffee beans',quantity:50,unit:'kg',budgetMinor:2500000,deadline:new Date(Date.now()+604800000).toISOString(),location:'Mumbai'});put('intent',tenant,{...intent,discoveryMode:'local_sample'});put('message',tenant,{intentId:intent.id,roomId:intent.id+'-sup-mango',supplierId:'sup-mango',actor:'Buyer',text:'Could you improve delivery?',visibility:'private'});return intent;}
function respond(wait?:Promise<void>){mocks.offer.mockImplementation(async(_input,controls)=>{await controls.reserve('0G','inference');if(wait)await wait;await controls.onUsage?.({provider:'0G',model:'fixture',requestId:result.requestId});return result;});}
beforeEach(()=>{db().exec('DELETE FROM records; DELETE FROM events; DELETE FROM dedupe;');seedBusiness(tenant,'Private Test');vi.stubEnv('INFERENCE_MAX_CALLS','10');vi.stubEnv('HEDERA_ACCOUNT_ID','0.0.1');vi.stubEnv('HEDERA_MERCHANT_ACCOUNT_ID','0.0.2');vi.stubEnv('HEDERA_TINYBAR_PER_MINOR','1');mocks.offer.mockReset();});
afterEach(()=>{vi.unstubAllEnvs();});

describe('private agent workflow authority',()=>{
  it('records one private immutable offer and returns idempotent results without another call',async()=>{
    const intent=request();respond();
    put('message',tenant,{intentId:intent.id,roomId:intent.id+'-sup-banyan',supplierId:'sup-banyan',actor:'Buyer',text:'Another seller private limit',visibility:'private'});
    const input={supplierId:'sup-mango',requestId:'private-request-one'};
    const first=await requestPrivateAgentReply(tenant,intent.id,input,context);
    expect(first.status).toBe('completed');expect(first.quote.visibility).toBe('private');expect(first.quote.requestIds).toEqual([result.requestId]);
    expect(mocks.offer.mock.calls[0][0].conversation).toEqual([{actor:'Buyer',text:'Could you improve delivery?'}]);
    const repeat=await requestPrivateAgentReply(tenant,intent.id,input,context);
    expect(repeat.quoteId).toBe(first.quoteId);expect(mocks.offer).toHaveBeenCalledTimes(1);expect(list('usage',tenant)).toHaveLength(1);
    expect(settings(tenant).inferenceReserved).toBe(0);expect(get('intent',tenant,intent.id)?.status).toBe('awaiting_approval');
  });
  it('does not admit concurrent duplicate requests while a model result is pending',async()=>{
    const intent=request();let release!:()=>void;respond(new Promise<void>(resolve=>{release=resolve;}));
    const input={supplierId:'sup-mango',requestId:'private-concurrent-request'};
    const pending=requestPrivateAgentReply(tenant,intent.id,input,context);
    await vi.waitFor(()=>expect(mocks.offer).toHaveBeenCalledTimes(1));
    await expect(requestPrivateAgentReply(tenant,intent.id,input,context)).rejects.toMatchObject({status:409});
    release();await pending;expect(mocks.offer).toHaveBeenCalledTimes(1);expect(list('quote',tenant)).toHaveLength(1);
  });
  it('discards a late model offer after authority is paused and retains request evidence',async()=>{
    const intent=request();let release!:()=>void;respond(new Promise<void>(resolve=>{release=resolve;}));
    const pending=requestPrivateAgentReply(tenant,intent.id,{supplierId:'sup-mango',requestId:'private-paused-request'},context);
    await vi.waitFor(()=>expect(mocks.offer).toHaveBeenCalledTimes(1));controlIntent(tenant,intent.id,'pause');release();
    await expect(pending).rejects.toMatchObject({status:409});expect(list('quote',tenant)).toHaveLength(0);
    expect(get('intent',tenant,intent.id)?.status).toBe('paused');expect(list('private_negotiation',tenant)[0].providerRequestId).toBe(result.requestId);expect(settings(tenant).inferenceReserved).toBe(0);
  });
  it('rejects unrelated tenants and exhausted allowance without creating a quote',async()=>{
    const intent=request();respond();
    await expect(requestPrivateAgentReply('unrelated',intent.id,{supplierId:'sup-mango',requestId:'private-isolation-request'},context)).rejects.toMatchObject({status:404});
    vi.stubEnv('INFERENCE_MAX_CALLS','0');await expect(requestPrivateAgentReply(tenant,intent.id,{supplierId:'sup-mango',requestId:'private-budget-request'},context)).rejects.toMatchObject({status:409});
    expect(list('usage',tenant)).toHaveLength(0);expect(list('quote',tenant)).toHaveLength(0);expect(list('private_negotiation',tenant)[0].status).toBe('blocked');
  });
});
