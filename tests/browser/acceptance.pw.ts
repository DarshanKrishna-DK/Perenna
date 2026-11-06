import {type Page} from '@playwright/test';
import {test, expect} from './fixtures';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

async function register(page: Page) {
  // Financial UI tests use explicit observations and never query a live wallet.
  await page.route('**/api/funds',route=>route.fulfill({json:{wallets:{},pendingCommitments:{goodsAtomic:'0',operatingAtomic:'0',platformFeesAtomic:'0'},settledFeeRevenueAtomic:'0',inferenceCredits:{status:'unknown'},topups:[]}}));
  await page.goto('/onboarding', {waitUntil:'domcontentloaded'});
  await page.getByLabel('Your name', {exact:true}).fill('Browser acceptance');
  await page.getByLabel('Business name', {exact:true}).fill('Canopy Acceptance Cafe');
  const email=`browser-${crypto.randomUUID()}@example.invalid`;
  await page.getByLabel('Email', {exact:true}).fill(email);
  await page.getByLabel('Password', {exact:true}).fill('Synthetic-browser-pass-9281');
  await page.locator('input[name="workspaceConsent"]').check();
  await page.getByRole('button', {name:'Create my workspace', exact:true}).click();
  await page.waitForURL('**/workspace', {waitUntil:'domcontentloaded'});
  await expect(page.getByRole('heading', {name:'Room to move.', exact:true})).toBeVisible();
  return email;
}

async function createIntent(page: Page) {
  await page.getByLabel('Item and specification', {exact:true}).fill('Coffee beans');
  await page.getByLabel('Delivery deadline', {exact:true}).fill(new Date(Date.now()+7*86400000).toISOString().slice(0,10));
  await page.getByRole('button', {name:'Save buying intent', exact:true}).click();
  await expect(page.getByRole('status').filter({hasText:'Request saved'})).toBeVisible();
}

async function captureSpatialPage(page:Page,route:string,project:string){
 const anchor=page.locator('.hero-stage').first();
 if(await anchor.isVisible())await anchor.scrollIntoViewIfNeeded();
 await expect(page.locator('.spatial-stage')).toHaveAttribute('data-scene-state',/ready|fallback/);
 await page.evaluate(()=>document.fonts.ready);
 // Allow the compositor to settle after scrolling the actual mobile scene anchor into view.
 await page.waitForTimeout(250);
 await page.screenshot({path:resolve('artifacts/browser',route+'-'+project+'-scene-viewport.png')});
 const scene=await page.evaluate(()=>({route:location.pathname,sceneState:document.querySelector('.spatial-stage')?.getAttribute('data-scene-state'),sceneMode:document.querySelector('.spatial-stage')?.getAttribute('data-scene-mode'),appScene:document.querySelector('.app')?.getAttribute('data-scene-ready'),canvasCount:document.querySelectorAll('.spatial-stage canvas').length,background:getComputedStyle(document.body).backgroundColor,rootOverflow:document.documentElement.scrollWidth>innerWidth,logo:!!document.querySelector('.brand-image[src="/brand/perenna-logo.png"]')}));
 await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
 await page.waitForTimeout(250);
 await page.screenshot({path:resolve('artifacts/browser',route+'-'+project+'.png'),fullPage:true});
 await page.screenshot({path:resolve('artifacts/browser',route+'-'+project+'-viewport.png')});
 return scene;
}

test('the scene finishes loading with reduced motion on initial load and refresh', async ({page}) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  for (let visit=0;visit<2;visit++) {
    if (visit===0) await page.goto('/',{waitUntil:'domcontentloaded'});
    else await page.reload({waitUntil:'domcontentloaded'});
    await expect(page.locator('.spatial-stage')).toHaveAttribute('data-scene-state','ready',{timeout:20000});
    await expect(page.locator('.app')).toHaveAttribute('data-scene-ready','webgl');
    await expect(page.locator('.spatial-stage canvas')).toHaveCount(1);
    await expect(page.locator('.spatial-fallback')).toHaveCount(0);
  }
});

test('agreement discovery requires reviewed public consent and exposes read-only search', async ({page},info) => {
  await register(page);
  const origin=new URL(page.url()).origin;
  const supplier='0x2222222222222222222222222222222222222222';
  const response=await page.request.post('/api/agreements',{headers:{Origin:origin},data:{supplierId:'sup-banyan',item:'coffee beans',unit:'kg',quantity:10,maxUnitPriceMinor:2050,perOrderCapMinor:50000,aggregateCapMinor:100000,perOrderCapAtomic:'50000',aggregateCapAtomic:'100000',buyerAddress:'0x1111111111111111111111111111111111111111',supplierAddress:supplier,payeeAddress:supplier,executorAddress:'0x3333333333333333333333333333333333333333',contractAddress:'0x4444444444444444444444444444444444444444',startsAt:new Date().toISOString(),expiresAt:new Date(Date.now()+86400000).toISOString()}});
  expect(response.status()).toBe(201);
  const agreement=await response.json(),projectionDigest='a'.repeat(64),calls:Record<string,any>[]=[];
  await page.route(`**/api/agreements/${agreement.id}`,async route=>{
    const body=route.request().postDataJSON();calls.push(body);
    if(body.action==='prepare-discovery')return route.fulfill({json:{projectionDigest,maximumFeeWei:'1000000000000000',signed:false,submitted:false,publicProjection:{item:'coffee beans',unit:'kg',area:'Mumbai',indexStatus:'proposed',startsMs:Date.now(),expiresMs:Date.now()+86400000,createdMs:Date.now(),agreementVersion:1,indexVersion:1,agreementCommitment:'0x'+'a'.repeat(64),businessCommitment:'0x'+'b'.repeat(64),termsCommitment:'0x'+'c'.repeat(64)}}});
    if(body.action==='publish-discovery')return route.fulfill({json:{status:'confirmed',fixture:true}});
    if(body.action==='discover-indexes')return route.fulfill({json:{entities:[{entityKey:'fixture-query-row',item:'coffee beans',area:'Mumbai',indexStatus:'proposed'}],truncated:false}});
    return route.fulfill({status:409,json:{error:'No live publication or payment is allowed in this test.'}});
  });
  await page.goto('/agreements',{waitUntil:'domcontentloaded'});
  await page.getByText('Public agreement discovery',{exact:true}).click();
  await page.getByRole('button',{name:'Review public listing',exact:true}).click();
  const publish=page.getByRole('button',{name:'Publish reviewed listing',exact:true});
  await expect(publish).toBeDisabled();
  await expect(page.getByText('0.001',{exact:true})).toBeVisible();
  await page.getByText('Public commitments and versions',{exact:true}).click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('.agreement-discovery').screenshot({path:resolve('artifacts/browser',`agreement-discovery-review-${info.project.name}.png`)});
  await page.getByRole('checkbox',{name:'I approve publication of this exact public projection.',exact:true}).check();
  await publish.click();
  expect(calls.find(call=>call.action==='publish-discovery')).toEqual({action:'publish-discovery',confirmPublicDiscovery:true,projectionDigest});
  await page.getByRole('button',{name:'Query current listings',exact:true}).click();
  await expect(page.getByRole('status').filter({hasText:'Current matching listings'})).toContainText('1');
  expect(calls.filter(call=>call.action==='publish-discovery')).toHaveLength(1);
});

test('request publication separates private details and requires exact reviewed consent', async ({page},info) => {
  await register(page);
  const origin=new URL(page.url()).origin;
  const saved=await page.request.post('/api/intents',{headers:{Origin:origin},data:{item:'coffee beans',unit:'kg',quantity:20,budgetMinor:200000,deadline:new Date(Date.now()+7*86400000).toISOString(),location:'Mumbai',deliveryAddress:'Private loading entrance',contact:'private-review@example.invalid',specification:'Whole roasted beans'}});
  expect(saved.status()).toBe(201);
  const intent=await saved.json(),projectionDigest='c'.repeat(64),calls:Record<string,any>[]=[];
  const projection={item:intent.item,quantity:intent.quantity,unit:intent.unit,area:'Mumbai',requestExpiresMs:Date.parse(intent.expiresAt),deliveryDeadlineMs:Date.parse(intent.deadline),deliveryTimezone:'Asia/Kolkata',requestVersion:intent.version,policyVersion:1,createdMs:Date.parse(intent.createdAt),businessCommitment:'0x'+'a'.repeat(64),requestCommitment:'0x'+'b'.repeat(64)};
  await page.route(`**/api/intents/${intent.id}/*`,async route=>{
    const path=new URL(route.request().url()).pathname,body=route.request().postDataJSON();calls.push({path,body});
    if(path.endsWith('/publication-prepare'))return route.fulfill({json:{publicProjection:projection,projectionDigest,maximumFeeWei:'1000000000000000',privateReview:{...intent,procurementPerOrderCapMinor:2000000,procurementSessionCapMinor:2000000,procurementDailyCapMinor:2000000}}});
    if(path.endsWith('/publish'))return route.fulfill({json:{...intent,publicationStatus:'confirmed',arkiv:{entityKey:'0x'+'e'.repeat(64)}}});
    if(path.endsWith('/screening-refresh'))return route.fulfill({json:{intent:{...intent,publicationStatus:'confirmed'},suppliers:[{id:'sup-banyan',name:'Banyan Collective',credibility:86,eligible:true,reasons:[]},{id:'sup-estuary',name:'Estuary Traders',credibility:42,eligible:false,reasons:['Below your credibility threshold']}]}});
    return route.fulfill({status:409,json:{error:'Only fixture publication and read-only screening are admitted.'}});
  });
  await page.reload({waitUntil:'domcontentloaded'});
  const panel=page.locator('.intent-publication');
  await panel.getByRole('button',{name:'Review request publication',exact:true}).click();
  await expect(panel.getByRole('heading',{name:'Public on Arkiv',exact:true})).toBeVisible();
  await expect(panel.getByText('Private loading entrance',{exact:true})).toBeVisible();
  await expect(panel.getByText('private-review@example.invalid',{exact:true})).toBeVisible();
  const publish=panel.getByRole('button',{name:'Publish reviewed request',exact:true});
  await expect(publish).toBeDisabled();
  await panel.getByRole('checkbox',{name:'Publish this exact public request and retain the listed private details.',exact:true}).check();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await panel.screenshot({path:resolve('artifacts/browser',`intent-publication-review-${info.project.name}.png`)});
  await publish.click();
  expect(calls.find(call=>call.path.endsWith('/publish'))?.body).toEqual({expectedVersion:intent.version,confirmPublic:true,projectionDigest});
  await expect(panel.getByRole('status')).toContainText('confirmed on Arkiv');
  await panel.getByRole('button',{name:'Refresh supplier screening',exact:true}).click();
  await expect(panel.getByRole('heading',{name:'Current supplier screening',exact:true})).toBeVisible();
  await expect(panel.getByText('Below your credibility threshold',{exact:true})).toBeVisible();
  await expect(panel.getByRole('status')).toContainText('No negotiation or payment was started');
  expect(calls.filter(call=>call.path.endsWith('/publish'))).toHaveLength(1);
});

test('complete standing terms are reviewed and frozen from the actual form without funding', async ({page},info) => {
  await register(page);
  const business=(await(await page.request.get('/api/workspace')).json()).business;
  await page.route('**/api/agreements',route=>{
    const body=route.request().postDataJSON();
    if(route.request().method()==='POST'&&body.autoExecute===false&&!body.action)return route.continue();
    return route.fulfill({status:409,json:{error:'Only an unfunded local draft is permitted.'}});
  });
  await page.goto('/agreements',{waitUntil:'domcontentloaded'});
  const form=page.locator('.agreement-form');
  await form.locator('[name="supplierId"]').selectOption('sup-banyan');
  for(const [name,value] of Object.entries({item:'Coffee beans',quantity:'50',perOrderCap:'2000',aggregateCap:'4000',expiresAt:new Date(Date.now()+7*86400000).toISOString().slice(0,10)}))await form.locator(`[name="${name}"]`).fill(value);
  await form.locator('[name="onchain"]').check();
  const values={unit:'kilograms',location:'Mumbai',maxUnitPrice:'21',perOrderCapAtomic:'200000',aggregateCapAtomic:'400000',buyerAddress:'0x1111111111111111111111111111111111111111',supplierAddress:'0x2222222222222222222222222222222222222222',executorAddress:'0x3333333333333333333333333333333333333333',payeeAddress:'0x2222222222222222222222222222222222222222',contractAddress:'0x4444444444444444444444444444444444444444',frequencySeconds:'60',reorderQuantity:'50',settlementTinybarPerMinor:'1',deliveryMinor:'15000',taxMinor:'0',maxGasWei:'100000000000000000',sku:'BEANS-50',specification:'Whole roasted coffee beans, sealed 1 kg packs',qualityRequirements:'Sealed packs without substitutions',deliveryGeography:'Mumbai',deliveryTimezone:'Asia/Kolkata',deliveryWindowStart:'09:00',deliveryWindowEnd:'17:00',deliveryWeekdays:'1,2,3,4,5',deliveryLeadDays:'2',baselineUnitPrice:'20.50',priceToleranceBps:'100'};
  for(const [name,value] of Object.entries(values))await form.locator(`[name="${name}"]`).fill(value);
  await form.locator('[name="acknowledgmentRule"]').selectOption('bilateral_receipt_before_next_order');
  await expect(form.getByText('Frozen commercial and fulfillment rules',{exact:true})).toBeVisible();
  await form.screenshot({path:resolve('artifacts/browser',`standing-commercial-form-${info.project.name}.png`)});
  const responsePromise=page.waitForResponse(response=>new URL(response.url()).pathname==='/api/agreements'&&response.request().method()==='POST');
  await form.getByRole('button',{name:'Save agreement proposal',exact:true}).click();
  const response=await responsePromise;
  expect(response.status()).toBe(201);
  const record=await response.json();
  expect(record.terms).toMatchObject({item:'coffee beans',unit:'kg',autoExecute:false,commercialTerms:{sku:'BEANS-50',specification:values.specification,qualityRequirements:values.qualityRequirements,baselineUnitPriceMinor:2050,priceToleranceBps:100,deliveryTimezone:'Asia/Kolkata',deliveryWindowStart:'09:00',deliveryWindowEnd:'17:00',deliveryWeekdays:[1,2,3,4,5],acknowledgmentRule:'bilateral_receipt_before_next_order',renewalRule:'new_bilateral_agreement_only'}});
  expect(record.terms.businessIdentities).toMatchObject({buyer:{businessId:business.id,name:business.name,signerAddress:values.buyerAddress,provenance:'authenticated_business_profile',walletVerifiedAtDraft:false},supplier:{businessId:null,signerAddress:values.supplierAddress,provenance:'synthetic_fixture',fixtureId:'sup-banyan',walletVerifiedAtDraft:false},relationshipKind:'synthetic_catalogue_only',participantIds:[]});
  expect(record.terms.receiptPolicy).toMatchObject({claimantRole:'buyer',claimantBusinessId:business.id,claimantAddress:values.buyerAddress,countersignerRole:'supplier',countersignerBusinessId:null,countersignerAddress:values.supplierAddress,buyerAuthorityId:null,supplierAuthorityId:null,buyerAuthorityPolicy:'current_active_business_authority_at_frozen_wallet',supplierAuthorityPolicy:'frozen_synthetic_supplier_wallet'});
  expect(record.createTransactionHash).toBeUndefined();
  expect(record.buyerSignature).toBeNull();
  expect(record.status).toBe('awaiting_signatures');
});

test('payment stays separate from supplier response and intentional fulfillment controls', async ({page},info) => {
  await register(page);
  const workspace=await (await page.request.get('/api/workspace')).json();
  const order:Record<string,any>={id:'outcome-ui-fixture',intentId:'outcome-request-fixture',supplierId:'sup-banyan',supplierName:'Banyan Collective',item:'Coffee beans',quantity:20,unit:'kg',status:'paid',paymentStatus:'confirmed',totalMinor:50000,goodsMinor:49000,feeMinor:1000,deliveryMinor:0,taxMinor:0,amountAtomic:'50000',network:'hedera:testnet',asset:'0.0.0',createdAt:new Date().toISOString(),transactionId:'fixture-confirmed-payment'};
  let view:Record<string,any>={orderId:order.id,paymentStatus:'confirmed',supplierAcknowledgment:{status:'pending'},physicalState:'not_started',financialReconciliationRequired:false,hasSupplierParticipant:false,history:[]};
  const stages:string[]=[];
  await page.route('**/api/workspace',route=>route.fulfill({json:{...workspace,orders:[{...order,supplierAcknowledgment:view.supplierAcknowledgment,physicalState:view.physicalState,delayedFrom:view.delayedFrom}]}}));
  await page.route(`**/api/orders/${order.id}/outcomes`,route=>route.fulfill({json:view}));
  await page.route(`**/api/orders/${order.id}/simulate`,route=>{const {stage}=route.request().postDataJSON();stages.push(stage);if(stage==='accepted')view={...view,supplierAcknowledgment:{status:'accepted',provenance:'simulated_supplier_acceptance'}};else view={...view,delayedFrom:stage==='delayed'?view.physicalState:view.delayedFrom,physicalState:stage};view.history=[...view.history,{id:'ui-'+stages.length,createdAt:new Date().toISOString(),stage,provenance:'simulated_physical_event'}];return route.fulfill({json:view});});
  await page.goto('/orders',{waitUntil:'domcontentloaded'});
  await page.getByText('Physical event simulation',{exact:true}).click();
  const panel=page.locator('.order-outcomes');
  await expect(panel.getByText('Pending',{exact:true})).toBeVisible();
  await expect(panel.getByRole('button',{name:'Simulate: Preparing',exact:true})).toHaveCount(0);
  await panel.getByRole('button',{name:'Record sample supplier acceptance',exact:true}).click();
  await expect(panel.getByText('Simulated sample acceptance, no signature',{exact:false})).toBeVisible();
  for(const [stage,label] of [['preparing','Preparing'],['delayed','Delayed'],['preparing','Preparing'],['dispatched','Dispatched'],['delivered','Delivered']]){
    await panel.getByRole('button',{name:'Simulate: '+label,exact:true}).click();
    await expect(panel.locator('dd').last()).toHaveText(label);
    expect(view.paymentStatus).toBe('confirmed');
  }
  expect(stages).toEqual(['accepted','preparing','delayed','preparing','dispatched','delivered']);
  await expect(panel.getByRole('button',{name:'Simulate: Preparing',exact:true})).toHaveCount(0);
  await panel.getByText('Outcome history',{exact:true}).click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await panel.screenshot({path:resolve('artifacts/browser',`order-outcomes-${info.project.name}.png`)});
});

test('all public and authenticated pages render without overflow or client errors', async ({page}, info) => {
  const errors: string[]=[];
  page.on('pageerror', error=>errors.push(error.message));
  const scenes:unknown[]=[];
  const artifactDir=resolve('artifacts/browser');
  await mkdir(artifactDir,{recursive:true});
  for (const route of ['', 'onboarding']) {
    await page.goto('/'+route,{waitUntil:'domcontentloaded'});
    await expect(page.locator('h1').first()).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    scenes.push(await captureSpatialPage(page,route||'landing',info.project.name));
  }
  const email=await register(page);
  await createIntent(page);
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.locator('.request-leaf').first()).toContainText(/coffee beans/i);
  for (const route of ['workspace','negotiations','suppliers','orders','agreements','settings']) {
    await page.goto('/'+route,{waitUntil:'domcontentloaded'});
    await expect(page.locator('.page-heading')).toBeVisible();
    if(route==='settings')await expect(page.locator('.provider-row')).toHaveCount(5);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),route).toBe(true);
    scenes.push(await captureSpatialPage(page,route,info.project.name));
  }
  await writeFile(resolve(artifactDir,'scene-states-'+info.project.name+'.json'),JSON.stringify(scenes,null,2));
  await page.getByLabel('Business display name',{exact:true}).fill('Canopy Bakery');
  await page.getByLabel('Business category',{exact:true}).fill('Cafe and bakery');
  await page.getByRole('button',{name:'Save business preferences',exact:true}).click();
  await expect(page.getByLabel('Business category',{exact:true})).toHaveValue('Cafe and bakery');
  await page.reload();
  await expect(page.getByLabel('Business display name',{exact:true})).toHaveValue('Canopy Bakery');
  await page.getByRole('button',{name:'Sign out',exact:true}).click();
  await page.waitForURL('**/');
  await page.goto('/onboarding');
  await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await page.getByLabel('Email',{exact:true}).fill(email);
  await page.getByLabel('Password',{exact:true}).fill('Synthetic-browser-pass-9281');
  await page.getByRole('button',{name:'Open workspace',exact:true}).click();
  await page.waitForURL('**/workspace');
  await expect(page.locator('.request-leaf').first()).toContainText(/coffee beans/i);
  expect(errors).toEqual([]);
});

test('Hindi preference survives navigation and reduced motion stops sprite loops', async ({page}, info) => {
  await register(page);
  await page.getByRole('button',{name:'हिंदी',exact:true}).click();
  await expect(page.getByRole('heading',{name:'आगे बढ़ने की जगह।',exact:true})).toBeVisible();
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.getByRole('heading',{name:'आगे बढ़ने की जगह।',exact:true})).toBeVisible();
  await page.emulateMedia({reducedMotion:'reduce'});
  expect(await page.locator('.sprite-body').first().evaluate(element=>getComputedStyle(element).animationName)).toBe('none');
  await page.screenshot({path:resolve('artifacts/browser',`workspace-hindi-${info.project.name}.png`),fullPage:true});
});

test('structured parsing is reviewable and unavailable provider does not publish', async ({page}) => {
  await register(page);
  // This test isolates the browser interaction. It is not live inference evidence.
  await page.route('**/api/intents/parse',route=>route.fulfill({json:{value:{item:'Coffee beans',quantity:30,unit:'kg',budgetMinor:900000,deliveryDays:5,location:'Mumbai',missing:[]},provider:'Test provider',requestId:'browser-fixture'}}));
  await page.getByRole('textbox',{name:'Describe your buying request'}).fill('We need 30 kg of coffee beans.');
  await page.getByRole('button',{name:'Structure my request',exact:true}).click();
  await expect(page.getByLabel('Quantity',{exact:true})).toHaveValue('30');
  await expect(page.getByLabel('Budget in INR',{exact:true})).toHaveValue('9000');
  await expect(page.locator('.request-leaf')).toHaveCount(0);
  await page.getByLabel('Quantity',{exact:true}).fill('32');
  await page.getByRole('button',{name:'Save buying intent',exact:true}).click();
  await expect(page.locator('.request-leaf').first()).toContainText('32');
  await page.route('**/api/intents/parse',route=>route.fulfill({status:503,json:{error:'Inference temporarily unavailable. Your draft is preserved.'}}));
  await page.getByRole('button',{name:'Structure my request',exact:true}).click();
  await expect(page.getByRole('alert').filter({hasText:'Inference temporarily unavailable'})).toBeVisible();
  await expect(page.getByLabel('Quantity',{exact:true})).toHaveValue('32');
});

test('private messaging, agreement drafts and operating-policy controls use actual scoped state', async ({page}) => {
  await register(page);
  await createIntent(page);
  await page.goto('/negotiations',{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:'Private',exact:true}).click();
  await page.getByLabel('Private conversation supplier').selectOption('sup-mango');
  await page.getByRole('textbox',{name:'Message',exact:true}).fill('Please confirm the delivery window.');
  await page.getByRole('button',{name:'Send',exact:true}).click();
  await expect(page.locator('.message-feed')).toContainText('Please confirm the delivery window.');
  const privateIds:string[]=[];
  await page.route('**/api/intents/*/private-negotiate',route=>{privateIds.push(route.request().postDataJSON().requestId);return route.fulfill({status:409,json:{error:'The authorized reasoning allowance is exhausted. Review this request before retrying.'}})});
  await page.getByRole('button',{name:'Request supplier agent reply',exact:true}).click();
  await expect(page.getByRole('alert').filter({hasText:'The authorized reasoning allowance is exhausted.'})).toBeVisible();
  await page.reload();
  await page.getByRole('button',{name:'Private',exact:true}).click();
  await page.getByLabel('Private conversation supplier').selectOption('sup-mango');
  await page.getByRole('button',{name:'Request supplier agent reply',exact:true}).click();
  await expect.poll(()=>privateIds.length).toBe(2);
  expect(privateIds[0]).toBe(privateIds[1]);
  await page.getByRole('button',{name:'Start a new request after reviewing usage',exact:true}).click();
  expect(privateIds.length).toBe(2);
  await expect(page.locator('.private-request-recovery')).toContainText('An earlier request may have consumed credits.');
  await page.getByText('Previous private reply references',{exact:true}).click();
  await expect(page.locator('.private-request-history')).toContainText(privateIds[0]);
  await page.getByRole('button',{name:'Request supplier agent reply',exact:true}).click();
  await expect.poll(()=>privateIds.length).toBe(3);
  expect(privateIds[2]).not.toBe(privateIds[1]);
  await page.reload();
  await page.getByRole('button',{name:'Private',exact:true}).click();
  await page.getByLabel('Private conversation supplier').selectOption('sup-mango');
  await expect(page.locator('.private-request-recovery')).toContainText(privateIds[2]);
  await expect(page.locator('.private-request-history')).toContainText(privateIds[0]);
  await page.getByRole('button',{name:'Request supplier agent reply',exact:true}).click();
  await expect.poll(()=>privateIds.length).toBe(4);
  expect(privateIds[3]).toBe(privateIds[2]);


  await page.getByRole('button',{name:'Group',exact:true}).click();
  await expect(page.locator('.message-feed')).not.toContainText('Please confirm the delivery window.');
  await page.goto('/agreements',{waitUntil:'domcontentloaded'});
  await expect(page.getByLabel('Prepare complete testnet signing terms')).toBeVisible();
  await page.getByLabel('Prepare complete testnet signing terms').check();
  await expect(page.getByLabel('Buyer EVM address',{exact:true})).toBeVisible();
  await expect(page.getByLabel('Aggregate cap, tinybars',{exact:true})).toBeVisible();
  await expect(page.getByLabel('Authorize scheduled repeat orders within these frozen limits')).not.toBeChecked();
  await expect(page.getByLabel('Frozen tinybars per indicative INR minor unit')).toBeVisible();
  await page.goto('/settings',{waitUntil:'domcontentloaded'});
  await expect(page.getByRole('button',{name:'Review and sign operating policy'})).toBeVisible();
  await expect(page.getByLabel('Automatically assess capacity when negotiation starts',{exact:true})).not.toBeChecked();
  await expect(page.getByLabel('Separate operating payer Hedera account')).toBeVisible();
  await expect(page.getByRole('button',{name:'Bind my business signing wallet'})).toBeVisible();
  await expect(page.getByLabel('Allowed resource base URL')).toHaveValue(/\/api\/services\/capacity\/$/);
  // No wallet signature, paid service, or blockchain transaction is invoked.
});


test('chain control preparation is reviewable and wallet rejection never confirms a control',async({page})=>{
 await register(page);
 const workspace=await (await page.request.get('/api/workspace')).json();
 const signer='0x1111111111111111111111111111111111111111';
 const contract='0x2222222222222222222222222222222222222222';
 const agreement={id:'browser-control-fixture',item:'Coffee beans',status:'active',contractStatus:'verified',hash:'fixture-digest',createTransactionHash:'0x'+'a'.repeat(64),acceptTransactionHash:'0x'+'b'.repeat(64),perOrderCapMinor:500000,aggregateCapMinor:2000000,expiresAt:new Date(Date.now()+86400000).toISOString(),terms:{buyerAddress:signer,supplierAddress:contract,executorAddress:signer,payeeAddress:contract,contractAddress:contract,item:'Coffee beans',quantity:10,perOrderCapAtomic:'100',aggregateCapAtomic:'1000',frequencySeconds:3600,autoExecute:false,expiresAt:new Date(Date.now()+86400000).toISOString()}};
 workspace.agreements=[agreement];
 let confirmed=false;
 await page.route('**/api/workspace',route=>route.fulfill({json:workspace}));
 await page.route('**/api/agreements/browser-control-fixture',async route=>{
  const input=route.request().postDataJSON();
  if(input.action==='prepare-control'){agreement.status='paused';agreement.contractStatus='pause_pending';return route.fulfill({json:{challengeId:'browser-only-challenge',control:'pause',unsignedTransaction:{from:signer,to:contract,data:'0x1234',value:'0',chainId:296}}})}
  confirmed=true;return route.fulfill({status:409,json:{error:'No confirmed transaction exists.'}});
 });
 // Browser-only wallet stub. No extension, key, or network signer is accessed.
 await page.addInitScript(()=>{(window as any).walletCalls=[];(window as any).ethereum={request:async({method}:any)=>{(window as any).walletCalls.push(method);if(method==='eth_chainId')return '0x128';if(method==='eth_requestAccounts')return ['0x1111111111111111111111111111111111111111'];throw Error('User rejected this test transaction.')}}});
 await page.goto('/agreements');
 await page.getByText('Review onchain agreement controls',{exact:true}).click();
 await page.getByRole('button',{name:'Prepare exact control transaction',exact:true}).click();
 await expect(page.getByText('Wallet transaction review',{exact:true})).toBeVisible();
 expect(await page.evaluate(()=>(window as any).walletCalls)).toEqual([]);
 await expect(page.getByText('Prepared only. No confirmed chain change is assumed.',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Review and submit control in wallet',exact:true}).click();
 await expect(page.getByRole('alert').filter({hasText:'User rejected this test transaction.'})).toBeVisible();
 expect(confirmed).toBe(false);
 await expect(page.locator('.chain-controls')).toContainText('pause_pending');
 let amendmentTerms:any;
 await page.route('**/api/agreements/browser-control-fixture/amend',async route=>{const input=route.request().postDataJSON();amendmentTerms=input.terms;expect(input.confirmReplacement).toBe(true);workspace.agreements=[{...agreement,status:'paused'},{...agreement,id:'replacement-fixture',status:'awaiting_signatures',amendmentOf:agreement.id,createTransactionHash:null,acceptTransactionHash:null}];return route.fulfill({status:201,json:{agreement:workspace.agreements[1],original:workspace.agreements[0],fundingTransferred:false,requiresFreshSignatures:true}})});
 await page.getByRole('button',{name:'Prepare amendment',exact:true}).click();
 await expect(page.locator('.agreement-form')).toContainText('Original funding is not migrated.');
 await expect(page.getByLabel('Item and specification',{exact:true})).toHaveValue('Coffee beans');
 await page.getByLabel('Maximum unit price, INR',{exact:true}).fill('100');
 await page.getByLabel('Scheduled reorder quantity',{exact:true}).fill('5');
 await page.getByLabel('Frozen tinybars per indicative INR minor unit',{exact:true}).fill('10');
 // The legacy agreement has no commercial terms. Review a complete replacement rather than inheriting invented defaults.
 const replacement=page.locator('.agreement-form');
 for(const [label,value] of [
  ['Product SKU','COFFEE-REVIEWED'],
  ['Exact product specification','Whole coffee beans in sealed 1 kg bags'],
  ['Required quality','Dry sealed packaging; no certification asserted'],
  ['Permitted cities, comma separated','Mumbai'],
  ['Delivery timezone','Asia/Kolkata'],
  ['Delivery window starts, HH:mm','09:00'],
  ['Delivery window ends, HH:mm','17:00'],
  ['Delivery weekdays, Monday 1 to Sunday 7','1,2,3,4,5'],
  ['Minimum delivery lead time, days','2'],
  ['Exact baseline unit price, INR','100'],
  ['Allowed price change, basis points (0 means exact)','0'],
 ])await replacement.getByLabel(label,{exact:true}).fill(value);
 await replacement.locator('select[name="acknowledgmentRule"]').selectOption('bilateral_receipt_before_next_order');
 await page.getByLabel('I have reviewed this replacement and the separate original funding.',{exact:true}).check();
 await page.getByRole('button',{name:'Save agreement proposal',exact:true}).click();
 await expect(page.locator('.agreement-leaf')).toHaveCount(2);
 expect(amendmentTerms).toBeTruthy();
 expect(amendmentTerms.commercialTerms).toMatchObject({version:1,currency:'INR',sku:'COFFEE-REVIEWED',specification:'Whole coffee beans in sealed 1 kg bags',qualityRequirements:'Dry sealed packaging; no certification asserted',substitutionPolicy:'none',deliveryGeography:['Mumbai'],deliveryTimezone:'Asia/Kolkata',deliveryWindowStart:'09:00',deliveryWindowEnd:'17:00',deliveryWeekdays:[1,2,3,4,5],deliveryLeadDays:2,baselineUnitPriceMinor:10000,priceToleranceBps:0,acknowledgmentRule:'bilateral_receipt_before_next_order'});
 expect(amendmentTerms.id).toBeUndefined();expect(amendmentTerms.hash).toBeUndefined();expect(amendmentTerms.buyerSignature).toBeUndefined();expect(amendmentTerms.supplierSignature).toBeUndefined();

});


test('only proven unsigned payment attempts expose retry',async({page})=>{
 await register(page);
 const workspace=await (await page.request.get('/api/workspace')).json();
 workspace.orders=[{id:'unsigned-fixture',supplierName:'Unsigned supplier',status:'approved',paymentStatus:'authorization_required',paymentAttemptStatus:'not_submitted',paymentRetryable:true,totalMinor:10000,createdAt:new Date().toISOString()},{id:'signed-fixture',supplierName:'Signed supplier',status:'approved',paymentStatus:'unknown',paymentAttemptStatus:'signed',paymentRetryable:false,totalMinor:10000,createdAt:new Date().toISOString()}];
 await page.route('**/api/workspace',route=>route.fulfill({json:workspace}));
 let retryCount=0;
 await page.route('**/api/orders/unsigned-fixture/retry-payment',route=>{retryCount++;return route.fulfill({status:409,json:{error:'Configuration is still incomplete. No transaction was submitted.'}})});
 await page.goto('/orders');
 await expect(page.getByRole('button',{name:'Retry unsubmitted payment',exact:true})).toHaveCount(1);
 await expect(page.getByRole('button',{name:'Reconcile payment',exact:true})).toHaveCount(2);
 await expect(page.getByRole('button',{name:'Submit authorized testnet payment',exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Retry unsubmitted payment',exact:true}).click();
 await expect(page.getByRole('alert').filter({hasText:'Configuration is still incomplete.'})).toBeVisible();
 expect(retryCount).toBe(1);
 await expect(page.locator('.order-sheet').filter({has:page.getByRole('heading',{name:'Signed supplier',exact:true})})).not.toContainText('Retry unsubmitted payment');
});


test('automatic assessment opt-in is included in the exact signed operating policy',async({page})=>{
 await register(page);
 let submitted:any;
 await page.route('**/api/service-policy',async route=>{if(route.request().method()==='GET')return route.fulfill({json:{policies:[],purchases:[]}});submitted=route.request().postDataJSON();return route.fulfill({json:{id:submitted.policy.id,status:'active'}})});
 // A browser-only signing stub records bytes. It authorizes no real service or payment.
 await page.addInitScript(()=>{(window as any).signedPolicy='';(window as any).ethereum={request:async({method,params}:any)=>{if(method==='eth_requestAccounts')return ['0x1111111111111111111111111111111111111111'];if(method==='personal_sign'){(window as any).signedPolicy=params[0];return '0x'+'1'.repeat(130)}throw Error('Unexpected wallet method')}}});
 await page.goto('/settings');
 await page.getByLabel('Separate operating payer Hedera account').fill('0.0.123');
 await page.getByLabel('Allowed merchant Hedera account').fill('0.0.456');
 await page.getByLabel('Per-call cap, tinybars',{exact:true}).fill('100');
 await page.getByLabel('Total cap, tinybars').fill('1000');
 await page.getByLabel('Underlying facilitator transaction fee cap, tinybars').fill('100000');
 await page.getByLabel('Valid until (maximum seven days)').fill(new Date(Date.now()+86400000).toISOString().slice(0,16));
 await page.getByLabel('Automatically assess capacity when negotiation starts').check();
 await page.getByRole('button',{name:'Review and sign operating policy',exact:true}).click();
 await expect.poll(()=>submitted?.policy.autoAssessForNegotiation).toBe(true);
 const hex=await page.evaluate(()=>(window as any).signedPolicy);
 const signed=JSON.parse(Buffer.from(hex.slice(2),'hex').toString('utf8'));
 expect(signed).toEqual(submitted.policy);expect(signed.autoAssessForNegotiation).toBe(true);
});


test('private intent details and independent budget boundaries persist',async({page})=>{
 await register(page);
 await page.getByText('Specifications, delivery and offer rules',{exact:true}).click();
 await page.getByLabel('Detailed specification',{exact:true}).fill('Whole coffee beans, sealed 5 kg bags');
 await page.getByLabel('Quality requirements',{exact:true}).fill('Dry, sealed packaging');
 await page.getByLabel('Hard criteria, one per line',{exact:true}).fill('No substitutions');
 await page.getByLabel('Preferred criteria, one per line',{exact:true}).fill('Recyclable packaging');
 await page.getByRole('combobox',{name:'Substitution policy',exact:true}).selectOption('none');
 await page.getByRole('textbox',{name:'Exact delivery address, private',exact:true}).fill('Synthetic private address, unit 99');
 await page.getByLabel('Delivery contact, private',{exact:true}).fill('Synthetic acceptance contact');
 await createIntent(page);
 const value=await (await page.request.get('/api/workspace')).json();
 expect(value.intents[0].deliveryAddress).toBe('Synthetic private address, unit 99');
 expect(value.intents[0].specification).toContain('sealed');
 expect(value.intents[0].hardCriteria).toEqual(['no_substitution']);
 await page.getByRole('button',{name:'Revise selected request',exact:true}).click();
 await page.getByText('Specifications, delivery and offer rules',{exact:true}).click();
 await expect(page.getByRole('textbox',{name:'Exact delivery address, private',exact:true})).toHaveValue('Synthetic private address, unit 99');
 await page.goto('/settings');
 await page.getByLabel('Goods per-order cap, INR',{exact:true}).fill('5000');
 await page.getByLabel('Goods session cap, INR',{exact:true}).fill('15000');
 await page.getByLabel('Goods daily cap, INR',{exact:true}).fill('20000');
 await page.getByLabel('Operating per-call cap, tinybars',{exact:true}).fill('10');
 await page.getByLabel('Operating session cap, tinybars',{exact:true}).fill('50');
 await page.getByLabel('Operating daily cap, tinybars',{exact:true}).fill('100');
 await page.getByRole('button',{name:'Save bounded spending limits',exact:true}).click();
 await expect.poll(async()=>{const data=await(await page.request.get('/api/workspace')).json();return data.settings.procurementPerOrderCapMinor}).toBe(500000);
});

test('funding review discloses exact terms and rejected wallet does not credit an allowance',async({page})=>{
 await register(page);
 let confirmations=0,authorizations=0;
 const source='0x1111111111111111111111111111111111111111',recipient='0x2222222222222222222222222222222222222222';
 await page.route('**/api/funds',route=>route.fulfill({json:{wallets:{operating:{status:'observed',accountId:'0.0.456',amountAtomic:'20',network:'hedera:testnet',asset:'0.0.0'}},pendingCommitments:{goodsAtomic:'5',operatingAtomic:'3',platformFeesAtomic:'0'},settledFeeRevenueAtomic:'0',topups:[]}}));
 await page.route('**/api/funds/topups',route=>route.fulfill({json:{id:'funding-fixture',shortfallAtomic:'30',amountAtomic:'40',recipientAccountId:'0.0.456',recipientEvmAddress:recipient,network:'hedera:testnet',asset:'0.0.0',revisedOperatingLimitAtomic:'100',sourceEvmAddress:source,reviewMessage:'Exact synthetic session cap review: 100 tinybars',status:'awaiting_review',unsignedTransaction:{from:source,to:recipient,value:'400000000000',data:'0x',chainId:296}}}));
 await page.route('**/api/funds/topups/funding-fixture/authorize',route=>{authorizations++;expect(route.request().postDataJSON().signature).toMatch(/^0x/);return route.fulfill({json:{id:'funding-fixture',amountAtomic:'40',recipientAccountId:'0.0.456',recipientEvmAddress:recipient,sourceEvmAddress:source,network:'hedera:testnet',asset:'0.0.0',revisedOperatingLimitAtomic:'100',status:'awaiting_wallet',unsignedTransaction:{from:source,to:recipient,value:'400000000000',data:'0x',chainId:296}}})});
 await page.route('**/api/funds/topups/*/confirm',route=>{confirmations++;return route.fulfill({status:409,json:{error:'No confirmed receipt.'}})});
 await page.addInitScript(()=>{(window as any).ethereum={request:async({method}:any)=>{if(method==='eth_chainId')return '0x128';if(method==='eth_requestAccounts')return ['0x1111111111111111111111111111111111111111'];if(method==='personal_sign')return '0x'+'1'.repeat(130);throw Error('User declined the funding transaction.')}}});
 await page.goto('/settings');
 await page.getByText('Review an operating wallet top-up',{exact:true}).click();
 await page.getByLabel('Funding source EVM address',{exact:true}).fill(source);
 await page.getByLabel('Required operating funds, tinybars',{exact:true}).fill('50');
 await page.getByLabel('Top-up amount, tinybars',{exact:true}).fill('40');
 await page.getByLabel('Revised operating session cap, tinybars',{exact:true}).fill('100');
 await page.getByRole('button',{name:'Prepare funding review',exact:true}).click();
 await expect(page.locator('.funding-review')).toContainText('0.0.456');
 await expect(page.locator('.funding-review')).toContainText('30');
 await expect(page.getByRole('button',{name:'Review and submit top-up in wallet',exact:true})).toBeDisabled();
 await page.getByRole('button',{name:'Sign exact operating session-budget review',exact:true}).click();
 await expect(page.getByRole('button',{name:'Review and submit top-up in wallet',exact:true})).toBeEnabled();
 expect(authorizations).toBe(1);
 await page.getByRole('button',{name:'Review and submit top-up in wallet',exact:true}).click();
 await expect(page.getByRole('alert').filter({hasText:'User declined the funding transaction.'})).toBeVisible();
 expect(confirmations).toBe(0);
});


test('explicit parsing nulls clear material defaults and rich zoned terms remain reviewable',async({page})=>{
 await register(page);
 await page.route('**/api/intents/parse',route=>route.fulfill({json:{value:{item:null,quantity:null,unit:null,budgetMinor:null,location:null,currency:'USD',deliveryDate:null,deliveryTime:null,deliveryTimezone:null,specification:'Sealed bags',deliveryAddress:'Synthetic private delivery',contact:'Synthetic contact',qualityRequirements:'Sealed',substitutionPolicy:'none',hardCriteria:['No substitutions'],preferredCriteria:['Recyclable'],missing:['delivery']},provider:'Browser fixture',requestId:'null-fixture'}}));
 await page.getByRole('textbox',{name:'Describe your buying request'}).fill('A request priced in USD with missing quantity.');
 await page.getByRole('button',{name:'Structure my request',exact:true}).click();
 for(const name of ['item','quantity','unit','budget','location','deadline','deliveryTime'])await expect(page.locator('[name="'+name+'"]').first()).toHaveValue('');
 await expect(page.getByRole('status').filter({hasText:'Only INR is supported.'})).toBeVisible();
 await page.getByText('Specifications, delivery and offer rules',{exact:true}).click();
 await expect(page.getByLabel('Hard criteria, one per line')).toHaveValue('No substitutions');
 await expect(page.getByLabel('Exact delivery address, private')).toHaveValue('Synthetic private delivery');
 await page.route('**/api/intents/parse',route=>route.fulfill({json:{value:{item:'Coffee beans',quantity:20,unit:'kg',budgetMinor:900000,location:'Mumbai',currency:'INR',deliveryDate:'2027-02-12',deliveryTime:'17:00',deliveryTimezone:'Asia/Kolkata',deliveryDays:1,missing:[]},provider:'Browser fixture',requestId:'zoned-fixture'}}));
 await page.getByRole('button',{name:'Structure my request',exact:true}).click();
 await expect(page.getByLabel('Delivery deadline',{exact:true})).toHaveValue('2027-02-12');
 await page.getByRole('button',{name:'Save buying intent',exact:true}).click();
 await expect(page.locator('.request-leaf')).toHaveCount(1);
 const data=await(await page.request.get('/api/workspace')).json();
 expect(Date.parse(data.intents[0].deadline)).toBe(Date.parse('2027-02-12T11:30:00Z'));
 await page.getByRole('button',{name:'Revise selected request',exact:true}).click();
 await page.getByText('Specifications, delivery and offer rules',{exact:true}).click();
 await expect(page.getByLabel('Delivery time',{exact:true})).toHaveValue('17:00');
 await expect(page.getByLabel('Delivery deadline',{exact:true})).toHaveValue('2027-02-12');
});

test('invalid or ambiguous local delivery time shows correction without a request or page error',async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await register(page);
 let submitted=0;await page.route('**/api/intents',route=>{submitted++;return route.fulfill({status:409,json:{error:'Unexpected submission'}})});
 await page.getByLabel('Item and specification',{exact:true}).fill('Coffee beans');
 await page.getByLabel('Delivery deadline',{exact:true}).fill('2027-03-14');
 await page.getByText('Specifications, delivery and offer rules',{exact:true}).click();
 await page.getByLabel('Delivery time',{exact:true}).fill('02:30');
 await page.getByLabel('Delivery timezone',{exact:true}).fill('America/New_York');
 await page.getByRole('button',{name:'Save buying intent',exact:true}).click();
 await expect(page.getByRole('alert').filter({hasText:'invalid or ambiguous'})).toBeVisible();
 expect(submitted).toBe(0);expect(errors).toEqual([]);
});
