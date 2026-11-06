import {afterEach,describe,expect,it,vi} from "vitest";
import {interpretIntent,negotiateSuppliers} from "../src/providers/inference";

afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
function enabled(){vi.stubEnv("INFERENCE_ENABLED","true");vi.stubEnv("INFERENCE_MAX_CALLS","10");vi.stubEnv("ZERO_G_MODEL","0gm-1.0-35b-a3b");vi.stubEnv("ZERO_G_API_KEY","fixture-not-a-live-key");}
const extracted={item:"coffee",quantity:10,unit:"kg",budgetMinor:null,deliveryDays:null,location:null,missing:["budget","delivery","location"]};
describe("structured provider responses",()=>{
 it('uses the alternate native model capability declaration without weakening JSON validation or token limits',async()=>{
  enabled();vi.stubEnv('ZERO_G_MODEL','0gm-1.0-35b-a3b-sia');let request:any;
  vi.stubGlobal('fetch',async(_url:any,init:any)=>{request=JSON.parse(init.body);return Response.json({id:'native-alternate-request',choices:[{finish_reason:'stop',message:{content:JSON.stringify(extracted)}}]});});
  const result=await interpretIntent('Coffee request','en',{reserve:async()=>{}});
  expect(request.response_format).toBeUndefined();expect(request.max_tokens).toBe(512);expect(request.chat_template_kwargs).toEqual({enable_thinking:false});expect(result.value).toEqual(extracted);expect(result.provider).toBe('0G');
  vi.stubGlobal('fetch',async()=>Response.json({id:'native-alternate-invalid',choices:[{finish_reason:'stop',message:{content:'Unstructured supplier text'}}]}));
  await expect(interpretIntent('Coffee request','en',{reserve:async()=>{}})).rejects.toMatchObject({code:'INVALID_RESPONSE'});
 });
 it('preserves explicit private delivery details and richer review criteria without inventing an exchange rate',async()=>{
  enabled();let input:any;const richer={...extracted,specification:'Whole beans',currency:'USD',budgetMinor:null,deliveryDate:'2026-11-12',deliveryTime:'17:30',deliveryTimezone:'Asia/Kolkata',location:'Mumbai',deliveryAddress:'Private delivery street',contact:'private@example.invalid',qualityRequirements:'Standard grade',substitutionPolicy:'ask',hardCriteria:['whole beans'],preferredCriteria:['earlier delivery'],quoteExpiresAt:'2026-11-10T12:00:00Z',missing:['supported INR budget']};
  vi.stubGlobal('fetch',vi.fn(async(_url,init)=>{input=JSON.parse(JSON.parse(init.body).messages[1].content);return Response.json({id:'rich-parse',choices:[{finish_reason:'stop',message:{content:JSON.stringify(richer)}}]});}));
  const result=await interpretIntent('Explicit rich buying request','en',{reserve:async()=>{}},{deliveryTimezone:'Asia/Kolkata'});
  expect(result.value).toEqual(richer);expect(result.value.budgetMinor).toBeNull();expect(input.deliveryTimezone).toBe('Asia/Kolkata');expect(Number.isFinite(Date.parse(input.currentTime))).toBe(true);
 });
 it.each([false,true])("accepts validated JSON with fence=%s and preserves the 0G request ID",async(fenced)=>{
  enabled();let body:any;let reserved=0;
  vi.stubGlobal("fetch",vi.fn(async(_url,init)=>{body=JSON.parse(init.body);return Response.json({id:"completion-test",x_0g_trace:{request_id:"request-test"},choices:[{finish_reason:"stop",message:{content:fenced?'```json\n'+JSON.stringify(extracted)+'\n```':JSON.stringify(extracted)}}]});}));
  const result=await interpretIntent("ten kilograms of coffee","en",{reserve:async()=>{reserved++;}});
  expect(result.value.quantity).toBe(10);expect(result.requestId).toBe("request-test");expect(reserved).toBe(1);
  expect(body.chat_template_kwargs).toEqual({enable_thinking:false});expect(body.max_tokens).toBe(512);
 });
 it("rejects truncated output even when its partial JSON happens to parse",async()=>{
  enabled();vi.stubGlobal("fetch",vi.fn(async()=>Response.json({id:"test-truncated",choices:[{finish_reason:"length",message:{content:JSON.stringify(extracted)}}]})));
  await expect(interpretIntent("coffee","en",{reserve:async()=>{}})).rejects.toMatchObject({code:"TOKEN_LIMIT",diagnostic:{requestId:"test-truncated",finishReason:"length"}});
 });
 it("keeps private buyer fields out of all public negotiation contexts",async()=>{
  enabled();const inputs:any[]=[];let reservations=0;let turns=0;
  vi.stubGlobal("fetch",vi.fn(async(_url,init)=>{
   const body=JSON.parse(init.body);const input=JSON.parse(body.messages[1].content);inputs.push(input);
   const value=body.messages[0].content.startsWith("You represent the buyer.")?{message:"Can you improve the delivery or price?"}:{unitPriceMinor:100,deliveryDays:1,summary:"A feasible public offer."};
   return Response.json({id:"test-"+inputs.length,choices:[{finish_reason:"stop",message:{content:JSON.stringify(value)}}]});
  }));
  const result=await negotiateSuppliers({item:"coffee",quantity:5,unit:"kg",location:"Mumbai",budgetMinor:123456789,text:"Private buying maximum is confidential",privateAddress:"private address"},[{id:"one",name:"First",stock:100},{id:"two",name:"Second",stock:100}],{reserve:async()=>{reservations++;},onTurn:async()=>{turns++;}});
  expect(result.quotes).toHaveLength(2);expect(reservations).toBe(5);expect(turns).toBe(5);
  for(const input of inputs){expect(input.intent).not.toHaveProperty("budgetMinor");expect(input.intent).not.toHaveProperty("text");expect(input.intent).not.toHaveProperty("privateAddress");}
 });
});

describe('explicit Groq failover',()=>{
 it('reserves each attempted provider and records actual mixed provenance after controlled 0G503',async()=>{
  enabled();vi.stubEnv('GROQ_FALLBACK_ENABLED','true');vi.stubEnv('GROQ_MODEL','fixture-groq-model');vi.stubEnv('GROQ_API_KEY','fixture-not-live');const reserved:string[]=[];let request=0;
  vi.stubGlobal('fetch',vi.fn(async(url,init)=>{request++;if(request===1)return new Response('{}',{status:503});const body=JSON.parse(init.body);const buyer=body.messages[0].content.startsWith('You represent the buyer.');return Response.json({id:'request-'+request,choices:[{finish_reason:'stop',message:{content:JSON.stringify(buyer?{message:'Please improve delivery.'}:{unitPriceMinor:100,deliveryDays:1,summary:'Offer'})}}]});}));
  const result=await negotiateSuppliers({item:'coffee',unit:'kg'},[{id:'one'}],{reserve:async(provider)=>{reserved.push(provider);}});
  expect(reserved).toEqual(['0G','Groq','0G','0G']);expect(result.provider).toContain('Groq');expect(result.provider).toContain('0G');expect(result.requestIds).toContain('request-2');
 });
 it.each(['BUDGET_EXCEEDED','OUTCOME_UNKNOWN'])('does not fail over after %s',async(code)=>{
  enabled();vi.stubEnv('GROQ_FALLBACK_ENABLED','true');const reserved:string[]=[];const fetchMock=vi.fn();vi.stubGlobal('fetch',fetchMock);
  await expect(negotiateSuppliers({},[{id:'one'}],{reserve:async(provider)=>{reserved.push(provider);throw Object.assign(new Error('blocked'),{provider:'0G',code});}})).rejects.toThrow('blocked');expect(reserved).toEqual(['0G']);expect(fetchMock).not.toHaveBeenCalled();
 });
});

describe('intent interpretation schema',()=>{it('rejects malformed model numeric and object fields before returning parsed success',async()=>{enabled();vi.stubGlobal('fetch',vi.fn(async()=>Response.json({id:'invalid-extraction',choices:[{finish_reason:'stop',message:{content:JSON.stringify({...extracted,quantity:{value:10},budgetMinor:'unbounded'})}}]})));await expect(interpretIntent('coffee','en',{reserve:async()=>{}})).rejects.toMatchObject({code:'INVALID_RESPONSE'});});});
