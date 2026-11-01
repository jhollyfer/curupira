import { defineConfig, devices } from '@playwright/test'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

// `.env.e2e` is optional: in CI the variables come from the environment. It loads before
// the rest of the config, because `webServer` and `baseURL` read `process.env`.
const envFile = resolve(import.meta.dirname, '..', '.env.e2e')
if (existsSync(envFile)) process.loadEnvFile(envFile)

const port = process.env.E2E_PORT ?? '3010'
const baseURL = `http://localhost:${port}`

// https://playwright.dev/docs/test-configuration
export default defineConfig({
  testDir: '.',
  outputDir: '../test-results',
  forbidOnly: Boolean(process.env.CI),
  // Unconditional retry turns a broken test into a flaky one
  // (_doc-lib/playwright.md#docs/test-retries).
  retries: 0,
  workers: 1,
  // Without a global cap, a job killed by the provider produces no report
  // (_doc-lib/playwright.md#docs/test-timeouts).
  globalTimeout: 15 * 60 * 1000,
  timeout: 60 * 1000,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: '../playwright-report' }],
  ],
  use: {
    baseURL,
    locale: 'pt-BR',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: {
      executablePath: process.env.E2E_CHROMIUM_PATH,
    },
  },
  projects: [
    // The resident app is a phone app: the flows run in a phone-sized viewport.
    {
      name: 'mobile',
      testMatch: /.*\.spec\.ts/,
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: {
    // The example data answers (`VITE_DATA_SOURCE=mock`): the flows need no backend.
    command: `pnpm exec vite dev --port ${port} --strictPort`,
    cwd: '..',
    url: baseURL,
    env: { VITE_DATA_SOURCE: 'mock' },
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})
