import {test, expect,guardProviderBoundaries} from './fixtures';

test('two authenticated sessions receive persisted messages and reject unrelated business access', async ({page, browser, baseURL}) => {
  const email = `realtime-${crypto.randomUUID()}@example.invalid`;
  const password = 'Synthetic-session-check-2026';
  const headers = {Origin:baseURL!};
  const registration = await page.request.post('/api/auth', {headers, data:{action:'register', email, password, name:'Session check', businessName:'Perenna Session Check',serviceArea:'Mumbai',workspaceConsent:true}});
  expect(registration.ok()).toBe(true);
  const created = await page.request.post('/api/intents', {headers, data:{item:'Coffee beans', quantity:50, unit:'kg', budgetMinor:2500000, deadline:new Date(Date.now()+604800000).toISOString(), location:'Mumbai'}});
  expect(created.ok()).toBe(true);
  const intent = await created.json();
  const other = await browser.newContext({baseURL, viewport:page.viewportSize()!});
  const unrelated = await browser.newContext({baseURL});
  try {
    await guardProviderBoundaries(other,baseURL!);
    await guardProviderBoundaries(unrelated,baseURL!);
    expect((await other.request.post('/api/auth', {headers, data:{action:'login', email, password}})).ok()).toBe(true);
    const observer = await other.newPage();
    await Promise.all([page.goto('/negotiations'), observer.goto('/negotiations')]);
    const text = `Shared session turn ${crypto.randomUUID()}`;
    await page.getByPlaceholder('Add your voice to the conversation').fill(text);
    await page.getByRole('button', {name:'Send', exact:true}).click();
    await expect(observer.getByText(text, {exact:true})).toBeVisible();
    await observer.goto('/workspace');
    await observer.goto('/negotiations');
    await expect(observer.getByText(text, {exact:true})).toHaveCount(1);
    const privateText = `Private session turn ${crypto.randomUUID()}`;
    expect((await page.request.post('/api/messages', {headers, data:{intentId:intent.id, supplierId:'sup-mango', text:privateText}})).ok()).toBe(true);
    await expect(observer.getByText(privateText, {exact:true})).toHaveCount(0);
    await observer.getByRole('button', {name:'Private', exact:true}).click();
    await observer.getByLabel('Private conversation supplier').selectOption('sup-mango');
    await expect(observer.getByText(privateText, {exact:true})).toBeVisible();
    expect((await unrelated.request.post('/api/auth', {headers, data:{action:'register', email:`isolated-${crypto.randomUUID()}@example.invalid`, password, name:'Unrelated owner', businessName:'Unrelated Business',serviceArea:'Mumbai',workspaceConsent:true}})).ok()).toBe(true);
    expect((await unrelated.request.get('/api/intents/'+intent.id)).status()).toBe(404);
    const events = await (await unrelated.request.get('/api/events')).text();
    expect(events).not.toContain(intent.id);
    expect(events).not.toContain(text);
    expect(events).not.toContain(privateText);
  } finally {
    await other.close();
    await unrelated.close();
  }
});
