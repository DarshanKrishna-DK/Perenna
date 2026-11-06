import {test as base, expect, type BrowserContext} from '@playwright/test';

/** Controlled page routes override this default block for their exact fixture endpoints. */
export async function guardProviderBoundaries(context:BrowserContext,baseURL:string){
 const origin=new URL(baseURL).origin;
 await context.route('**/*',async route=>{
  const request=route.request(),url=new URL(request.url());
  if(!['http:','https:'].includes(url.protocol))return route.continue();
  if(url.origin!==origin)return route.fulfill({status:451,json:{error:'External browser networking is disabled in acceptance tests.'}});
  const path=url.pathname;
  if(path==='/api/funds'&&request.method()==='GET')return route.fulfill({json:{wallets:{},pendingCommitments:{goodsAtomic:'0',operatingAtomic:'0',platformFeesAtomic:'0'},settledFeeRevenueAtomic:'0',inferenceCredits:{status:'unknown'},topups:[],networkCharges:[]}});
  if(!path.startsWith('/api/'))return route.continue();
  if(request.method()==='GET'){
   if(/^\/api\/(workspace|providers(?:\/capabilities)?|events|evidence|service-policy|signing-authority)$/.test(path)||/^\/api\/(intents|orders)\/[^/]+$/.test(path))return route.continue();
  }else if(/^\/api\/(auth|intents|messages|settings|business-profile)$/.test(path)||/^\/api\/intents\/[^/]+\/(pause|resume|cancel)$/.test(path))return route.continue();
  return route.fulfill({status:409,json:{error:'This provider, payment or publication boundary requires an explicit browser fixture. No live call is permitted.'}});
 });
}

export const test=base.extend<{providerBoundaryGuard:void}>({
 providerBoundaryGuard:[async({context,baseURL},use)=>{
  await guardProviderBoundaries(context,baseURL||'http://127.0.0.1:3000');
  await use();
 },{auto:true}],
});
export {expect};
