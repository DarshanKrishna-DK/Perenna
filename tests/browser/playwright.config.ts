import {defineConfig} from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.pw.ts',
  timeout: 90_000,
  expect: {timeout: 15_000},
  fullyParallel: false,
  workers: 1,
  outputDir: '../../artifacts/browser/test-results',
  reporter: [['line'], ['json', {outputFile: '../../artifacts/browser/acceptance-results.json'}]],
  use: {
    baseURL: process.env.PERENNA_BASE_URL || 'http://127.0.0.1:3000',
    launchOptions: {executablePath: process.env.PERENNA_CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'},
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'off',
  },
  projects: [
    {name: 'desktop', use: {viewport: {width: 1440, height: 1000}}},
    {name: 'mobile', use: {viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true}},
  ],
});
