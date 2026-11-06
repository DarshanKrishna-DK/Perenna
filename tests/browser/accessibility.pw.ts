import AxeBuilder from '@axe-core/playwright';
import {test, expect} from '@playwright/test';

test('public screens meet automated WCAG AA checks', async ({page}) => {
  for (const route of ['/', '/onboarding']) {
    await page.goto(route);
    await expect(page.locator('h1').first()).toBeVisible();
    const result = await new AxeBuilder({page}).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(result.violations, JSON.stringify(result.violations.map(({id, nodes}) => ({id, targets:nodes.map(node => node.target)})))).toEqual([]);
  }
});

test('authenticated screens meet automated WCAG AA checks', async ({page, baseURL}) => {
  const response = await page.request.post('/api/auth', {
    headers:{Origin:baseURL!},
    data:{action:'register', email:`a11y-${crypto.randomUUID()}@example.invalid`, password:'Synthetic-accessibility-check-2026', name:'Accessibility check', businessName:'Perenna Accessibility'},
  });
  expect(response.ok()).toBe(true);
  for (const route of ['/workspace', '/negotiations', '/suppliers', '/orders', '/agreements', '/settings']) {
    await page.goto(route);
    await expect(page.locator('h1').first()).toBeVisible();
    const result = await new AxeBuilder({page}).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(result.violations, `${route}: ${JSON.stringify(result.violations.map(({id, nodes}) => ({id, targets:nodes.map(node => node.target)})))}`).toEqual([]);
  }
});
