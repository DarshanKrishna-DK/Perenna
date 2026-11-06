import {beforeEach, afterEach, describe, expect, it, vi} from 'vitest';
const mocks=vi.hoisted(()=>{process.env.PERENNA_DB_PATH=':memory:';return {offer:vi.fn()};});
vi.mock('../src/providers/private-inference',()=>({negotiatePrivateOffer:mocks.offer}));
import {db,get,list,put} from '../src/server/store';
import {controlIntent,createIntent,seedBusiness,settings} from '../src/server/service';
import {recoverInterruptedPrivateNegotiations,requestPrivateAgentReply} from '../src/server/private-negotiation';
import {runNextJob} from '../src/server/jobs';
import {digest} from '../src/domain/procurement';

const tenant='private-workspace';
const context={userId:'private-owner',sessionId:'private-session'};
const result={terms:{unitPriceMinor:2100,deliveryDays:2,summary:'Controlled supplier offer'},provider:'0G',requestId:'controlled-private-request',model:'fixture'};
function request(){const intent=createIntent(tenant,{item:'coffee beans',quantity:50,unit:'kg',budgetMinor:2500000,deadline:new Date(Date.now()+604800000).toISOString(),location:'Mumbai'});put('intent',tenant,{...intent,discoveryMode:'local_sample'});put('message',tenant,{intentId:intent.id,roomId:intent.id+'-sup-mango',supplierId:'sup-mango',actor:'Buyer',text:'Could you improve delivery?',visibility:'private'});return intent;}
function respond(wait?:Promise<void>){mocks.offer.mockImplementation(async(_input,controls)=>{await controls.reserve('0G','inference');if(wait)await wait;await controls.onUsage?.({provider:'0G',model:'fixture',requestId:result.requestId});return result;});}
beforeEach(()=>{process.env.ARKIV_DISCOVERY_MODE='local_sample';db().exec('DELETE FROM records; DELETE FROM events; DELETE FROM dedupe;');seedBusiness(tenant,'Private Test');vi.stubEnv('INFERENCE_MAX_CALLS','10');vi.stubEnv('HEDERA_ACCOUNT_ID','0.0.1');vi.stubEnv('HEDERA_MERCHANT_ACCOUNT_ID','0.0.2');vi.stubEnv('HEDERA_TINYBAR_PER_MINOR','1');mocks.offer.mockReset();});
afterEach(()=>{vi.unstubAllEnvs();});

describe('private agent workflow authority',()=>{
  it('leaves queued public work intact while inference is paused, without acquiring an allowance',async()=>{
    vi.stubEnv('INFERENCE_ENABLED','false');const intent=request();put('job',tenant,{id:'paused-public-job',intentId:intent.id,intentVersion:intent.version,status:'queued',type:'negotiate',attempts:0,leaseUntil:0});
    expect(await runNextJob()).toBe(false);expect(get('job',tenant,'paused-public-job')).toMatchObject({status:'queued',attempts:0});expect(get('intent',tenant,intent.id)?.status).toBe(intent.status);expect(settings(tenant).inferenceReserved).toBe(0);expect(list('usage',tenant)).toHaveLength(0);expect(mocks.offer).not.toHaveBeenCalled();
  });
  it('recovers a persisted expired private lease on the worker tick without replaying or refunding inference usage',async()=>{
    const intent=request(),requestId='private-crashed-request',id='private-'+digest({tenant,intentId:intent.id,requestId});
    put('private_negotiation',tenant,{id,intentId:intent.id,supplierId:'sup-mango',status:'running',phase:'provider_requested',leaseUntil:Date.now()-1,requestId});
    put('settings',tenant,{...settings(tenant),inferenceReserved:1,inferenceOwnerId:id});put('intent',tenant,{...intent,status:'negotiating',privateJobId:id});
    put('usage',tenant,{id:'consumed-private-attempt',provider:'0G',operation:'inference',status:'reserved'});
    expect(await runNextJob()).toBe(false);expect(get('private_negotiation',tenant,id)?.status).toBe('interrupted');
    expect(settings(tenant).inferenceReserved).toBe(0);expect(settings(tenant).inferenceOwnerId).toBeUndefined();expect(get('intent',tenant,intent.id)).toMatchObject({status:'blocked'});expect(get('intent',tenant,intent.id)?.privateJobId).toBeUndefined();
    expect(list('usage',tenant)).toHaveLength(1);expect(mocks.offer).not.toHaveBeenCalled();
    await expect(requestPrivateAgentReply(tenant,intent.id,{supplierId:'sup-mango',requestId},context)).rejects.toMatchObject({status:409});expect(mocks.offer).not.toHaveBeenCalled();expect(recoverInterruptedPrivateNegotiations()).toBe(0);
  });
  it('preserves a different reservation owner and its intent while recovering a stale job, and leaves a fresh lease alone',()=>{
    const intent=request();put('private_negotiation',tenant,{id:'stale-private',intentId:intent.id,status:'running',leaseUntil:Date.now()-1});put('private_negotiation',tenant,{id:'new-private',intentId:intent.id,status:'running',leaseUntil:Date.now()+60000});
    put('settings',tenant,{...settings(tenant),inferenceReserved:1,inferenceOwnerId:'new-private'});put('intent',tenant,{...intent,status:'negotiating',privateJobId:'new-private'});
    expect(recoverInterruptedPrivateNegotiations()).toBe(1);expect(settings(tenant)).toMatchObject({inferenceReserved:1,inferenceOwnerId:'new-private'});expect(get('intent',tenant,intent.id)).toMatchObject({status:'negotiating',privateJobId:'new-private'});expect(get('private_negotiation',tenant,'new-private')?.status).toBe('running');
  });
  it('retains a late provider request reference after recovery but cannot create a quote or clear a newer reservation',async()=>{
    const intent=request();let release!:()=>void;respond(new Promise<void>(resolve=>{release=resolve;}));
    const pending=requestPrivateAgentReply(tenant,intent.id,{supplierId:'sup-mango',requestId:'private-expired-live-request'},context);
    await vi.waitFor(()=>expect(list('private_negotiation',tenant)[0].phase).toBe('provider_requested'));
    const job=list('private_negotiation',tenant)[0];put('private_negotiation',tenant,{...job,leaseUntil:Date.now()-1});expect(recoverInterruptedPrivateNegotiations()).toBe(1);
    put('settings',tenant,{...settings(tenant),inferenceReserved:1,inferenceOwnerId:'new-private-owner'});release();await expect(pending).rejects.toMatchObject({status:409});
    expect(list('quote',tenant)).toHaveLength(0);expect(get('private_negotiation',tenant,job.id)).toMatchObject({status:'interrupted',providerRequestId:result.requestId});expect(settings(tenant)).toMatchObject({inferenceReserved:1,inferenceOwnerId:'new-private-owner'});
  });
  it('recovers old persisted running rows that predate leases after their conservative five-minute window',()=>{
    const intent=request();put('private_negotiation',tenant,{id:'legacy-private',intentId:intent.id,status:'running',createdAt:new Date(Date.now()-360000).toISOString()});expect(recoverInterruptedPrivateNegotiations()).toBe(1);expect(get('private_negotiation',tenant,'legacy-private')?.status).toBe('interrupted');
  });
  it('does not let an expired public job release a currently owned private reservation',async()=>{
    const intent=request();put('job',tenant,{id:'old-public-job',intentId:intent.id,status:'running',leaseUntil:Date.now()-1});
    put('private_negotiation',tenant,{id:'current-private',intentId:intent.id,status:'running',leaseUntil:Date.now()+60000});
    put('settings',tenant,{...settings(tenant),inferenceReserved:1,inferenceOwnerId:'current-private'});put('intent',tenant,{...intent,status:'negotiating',privateJobId:'current-private'});
    expect(await runNextJob()).toBe(false);expect(get('job',tenant,'old-public-job')?.status).toBe('interrupted');expect(settings(tenant)).toMatchObject({inferenceReserved:1,inferenceOwnerId:'current-private'});expect(get('intent',tenant,intent.id)).toMatchObject({status:'negotiating',privateJobId:'current-private'});
  });
  it('does not let stale public recovery block a newer public negotiation on the same intent',async()=>{
    const intent=request();put('job',tenant,{id:'old-public-same-intent',intentId:intent.id,status:'running',leaseUntil:Date.now()-1});put('settings',tenant,{...settings(tenant),inferenceReserved:1,inferenceOwnerId:'new-public-owner'});put('intent',tenant,{...intent,status:'negotiating'});
    expect(await runNextJob()).toBe(false);expect(settings(tenant)).toMatchObject({inferenceReserved:1,inferenceOwnerId:'new-public-owner'});expect(get('intent',tenant,intent.id)?.status).toBe('negotiating');
  });
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
