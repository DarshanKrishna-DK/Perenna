import {afterEach, describe, expect, it, vi} from 'vitest';
import {negotiatePrivateOffer} from '../src/providers/private-inference';

afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
function configured(){vi.stubEnv('INFERENCE_ENABLED','true');vi.stubEnv('ZERO_G_MODEL','0gm-1.0-35b-a3b');vi.stubEnv('ZERO_G_API_KEY','fixture-private-inference-key');}

describe('isolated private supplier reasoning',()=>{
  it('sends only the selected private conversation, own offer and permitted intent fields',async()=>{
    configured();let captured:any;let reservations=0;
    vi.stubGlobal('fetch',vi.fn(async(_url,init)=>{captured=JSON.parse(init.body);return Response.json({id:'private-completion',x_0g_trace:{request_id:'private-request'},choices:[{finish_reason:'stop',message:{content:JSON.stringify({unitPriceMinor:1900,deliveryDays:2,summary:'A revised private offer.'})}}]});}));
    const result=await negotiatePrivateOffer({intent:{item:'coffee beans',specification:'Whole beans',quantity:50,unit:'kg',location:'Mumbai',budgetMinor:999999,privateDeliveryAddress:'Confidential street',privateContact:'private@example.invalid'},supplier:{id:'selected',unitPriceMinor:2000,stock:100},ownOffer:{unitPriceMinor:2000,deliveryDays:3,version:1,otherSupplierOffer:'must never forward'},buyerEvidence:{score:80,role:'buyer',privatePayment:'hidden'},conversation:[{actor:'Buyer',text:'Could delivery be two days?'}]}, {reserve:async()=>{reservations++;}});
    const input=JSON.parse(captured.messages[1].content);
    expect(result.requestId).toBe('private-request');expect(result.terms.deliveryDays).toBe(2);expect(reservations).toBe(1);
    expect(input.conversation).toEqual([{actor:'Buyer',text:'Could delivery be two days?'}]);
    expect(input.ownOffer).not.toHaveProperty('otherSupplierOffer');expect(input.buyerEvidence).not.toHaveProperty('privatePayment');
    for(const field of ['budgetMinor','privateDeliveryAddress','privateContact'])expect(input.intent).not.toHaveProperty(field);
    expect(captured.max_tokens).toBe(512);expect(captured.chat_template_kwargs.enable_thinking).toBe(false);
  });
  it('does not contact the provider without a conversation or when durable allowance rejects',async()=>{
    configured();const network=vi.fn();vi.stubGlobal('fetch',network);
    const input={intent:{item:'coffee'},supplier:{id:'one'},conversation:[]};
    await expect(negotiatePrivateOffer(input,{reserve:async()=>{}})).rejects.toThrow();expect(network).not.toHaveBeenCalled();
    await expect(negotiatePrivateOffer({...input,conversation:[{actor:'Buyer',text:'A question'}]},{reserve:async()=>{throw new Error('Allowance exhausted');}})).rejects.toThrow('Allowance exhausted');expect(network).not.toHaveBeenCalled();
  });
  it('rejects malformed commercial terms instead of presenting an agent message as a quote',async()=>{
    configured();vi.stubGlobal('fetch',vi.fn(async()=>Response.json({id:'malformed-private',choices:[{finish_reason:'stop',message:{content:JSON.stringify({unitPriceMinor:-1,deliveryDays:2,summary:'Pay now'})}}]})));
    await expect(negotiatePrivateOffer({intent:{item:'coffee'},supplier:{id:'one'},conversation:[{actor:'Buyer',text:'A question'}]},{reserve:async()=>{}})).rejects.toMatchObject({code:'INVALID_PROPOSAL'});
  });
});
