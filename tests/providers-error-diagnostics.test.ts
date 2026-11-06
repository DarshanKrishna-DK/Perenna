import {afterEach,expect,it,vi} from 'vitest';
import {providerFetch} from '../src/providers/config';
afterEach(()=>vi.unstubAllGlobals());
it('retains a bounded provider request reference without copying the error body',async()=>{
 vi.stubGlobal('fetch',async()=>new Response('sensitive upstream diagnostics',{status:502,headers:{'x-request-id':'trace-123'}}));
 const error=await providerFetch('0G','https://offline.test').catch(value=>value);
 expect(error).toMatchObject({code:'HTTP_502',diagnostic:{httpStatus:502,requestId:'trace-123'}});
 expect(JSON.stringify(error)).not.toContain('sensitive');
});
it('rejects unbounded or unsafe provider references',async()=>{
 vi.stubGlobal('fetch',async()=>new Response('',{status:503,headers:{'x-request-id':'x'.repeat(257)}}));
 await expect(providerFetch('0G','https://offline.test')).rejects.toMatchObject({diagnostic:{httpStatus:503}});
 const error=await providerFetch('0G','https://offline.test').catch(value=>value);
 expect(error.diagnostic.requestId).toBeUndefined();
});
