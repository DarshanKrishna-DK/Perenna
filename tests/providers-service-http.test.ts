import {afterAll,beforeAll,describe,expect,it,vi} from 'vitest';
import {createServer,type Server} from 'node:http';
import {randomUUID} from 'node:crypto';
const provider=vi.hoisted(()=>({prepare:vi.fn(),settle:vi.fn(),reconcile:vi.fn()}));
vi.mock('../src/providers/hedera',()=>({facilitatorCapabilities:async()=>({kinds:[{network:'hedera:testnet',scheme:'exact',x402Version:2,extra:{feePayer:'0.0.9'}}]}),preparePaidRequest:provider.prepare,settleProtectedRequest:provider.settle,reconcileHederaTransaction:provider.reconcile,signedTransactionId:(payload:any)=>payload.payload.transaction}));
import {get,put} from '../src/server/store';
import {executeServicePurchase,protectedServiceResult,settleServicePurchase,serviceChallenge} from '../src/server/service-payments';
const tenant='http-service-'+randomUUID();let origin:string,server:Server;const seen:string[]=[];
function purchase(id:string){const policyId=randomUUID();put('operating_policy',tenant,{id:policyId,status:'active',policyHash:'fixture',expiresAt:Date.now()+60000,version:1});put('service_payment',tenant,{id,policyId,policyHash:'fixture',resourceUrl:origin+'/api/services/capacity/'+id,status:'reserved',payer:'0.0.1',payee:'0.0.2',asset:'0.0.0',amountAtomic:'100',input:{supplierId:'sup-mango',intentId:'fixture',quantity:1,location:'Mumbai'}});}
beforeAll(async()=>{
 process.env.PERENNA_DB_PATH=':memory:';
 provider.prepare.mockImplementation(async(response:Response)=>{expect(response.status).toBe(402);expect(response.headers.get('payment-required')).toBeTruthy();return {payload:{payload:{transaction:'0.0.1@123.456'}},headers:{'PAYMENT-SIGNATURE':'signed-fixture'},requirements:{}};});
 provider.settle.mockResolvedValue({transaction:'facilitator-reported-alias'});provider.reconcile.mockResolvedValue({confirmed:true});
 server=createServer(async(req,res)=>{try{
  seen.push(req.method!);expect(req.headers.cookie).toBe('perenna_session=fixture');const id=req.url!.split('/').pop()!;
  if(req.method==='GET'){expect(()=>protectedServiceResult(tenant,id)).toThrow('Payment is required');const {challenge}=await serviceChallenge(tenant,id);res.writeHead(402,{'PAYMENT-REQUIRED':Buffer.from(JSON.stringify(challenge)).toString('base64')});res.end(JSON.stringify(challenge));}
  else{expect(req.headers.origin).toBe(origin);expect(req.headers['payment-signature']).toBe('signed-fixture');await settleServicePurchase(tenant,id,{payload:{transaction:'0.0.1@123.456'}} as any);res.writeHead(200);res.end(JSON.stringify(protectedServiceResult(tenant,id)));}
 }catch{res.writeHead(500);res.end();}});
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));const address=server.address() as {port:number};origin='http://127.0.0.1:'+address.port;
});
afterAll(async()=>{await new Promise<void>((resolve,reject)=>server.close(e=>e?reject(e):resolve()));vi.unstubAllGlobals();});
describe('autonomous protected HTTP service',()=>{
 it('gets402 and retries over HTTP with durable signed ID, only releasing receipt-confirmed assessment',async()=>{
  const id=randomUUID();purchase(id);const result=await executeServicePurchase(tenant,id,{origin,cookie:'perenna_session=fixture'});
  expect(seen).toEqual(['GET','POST']);expect(result.status).toBe('confirmed');expect(result.transactionId).toBe('0.0.1@123.456');expect(result.reportedTransactionId).toBe('facilitator-reported-alias');expect(protectedServiceResult(tenant,id).assessment).toBeTruthy();
  await executeServicePurchase(tenant,id,{origin,cookie:'perenna_session=fixture'});expect(seen).toHaveLength(2);
 });
 it('retains known signed ID on uncertain HTTP submit and blocks resending',async()=>{
  const id=randomUUID();purchase(id);provider.prepare.mockResolvedValueOnce({payload:{payload:{transaction:'0.0.1@999.456'}},headers:{'PAYMENT-SIGNATURE':'fixture'},requirements:{}});
  const fetchMock=vi.fn().mockResolvedValueOnce(new Response('{}',{status:402})).mockRejectedValueOnce(new Error('timeout'));vi.stubGlobal('fetch',fetchMock);
  await expect(executeServicePurchase(tenant,id,{origin,cookie:'fixture'})).rejects.toThrow('timeout');expect(get('service_payment',tenant,id)).toMatchObject({status:'unknown',transactionId:'0.0.1@999.456'});
  await expect(executeServicePurchase(tenant,id,{origin,cookie:'fixture'})).rejects.toThrow('Reconcile');expect(fetchMock).toHaveBeenCalledTimes(2);vi.unstubAllGlobals();
 });
 it('blocks cross-origin cookie forwarding before any request',async()=>{const id=randomUUID();purchase(id);await expect(executeServicePurchase(tenant,id,{origin:'https://unrelated.example',cookie:'fixture'})).rejects.toThrow('application origin');});
});


