import { defineConfig, devices } from '@playwright/test'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

import { apiUrl, baseUrl } from './support/env'

// `.env.e2e` is optional: in CI the variables come from the environment. It loads before
// the rest of the config, because `webServer` and `baseURL` read `process.env`.
const envFile = resolve(import.meta.dirname, '..', '.env.e2e')
if (existsSync(envFile)) process.loadEnvFile(envFile)

// No default: a missing key stops the run and says which one (`support/env.ts`).
const baseURL = baseUrl()
const port = new URL(baseURL).port

const inCI = Boolean(process.env.CI)

// In CI the app starts from its build, as in production; locally it is `vite dev`.
const appCommands = {
  true: 'node .output/server/index.mjs',
  false: `pnpm exec vite dev --port ${port} --strictPort`,
} as const

// https://playwright.dev/docs/test-configuration
export default defineConfig({
  testDir: '.',
  outputDir: '../test-results',
  forbidOnly: inCI,
  // Unconditional retry turns a broken test into a flaky one
  // (_doc-lib/playwright.md#docs/test-retries).
  retries: 0,
  // One worker: the flows write to the database and spend the API's login and report
  // limits, so they cannot overlap. Parallelism comes from the CI matrix, one job and one
  // database per viewport project. Locally, run one project at a time
  // (`--project=mobile`): each one files reports and the limiter allows ten an hour per IP.
  workers: 1,
  // Without a global cap, a job killed by the provider produces no report
  // (_doc-lib/playwright.md#docs/test-timeouts). Room for the slowest cold run, not a cure.
  globalTimeout: 25 * 60 * 1000,
  timeout: 60 * 1000,
  // The dev server compiles each route on first visit; 5s is not enough for that.
  expect: { timeout: 15 * 1000 },
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
    // Signs the roles in once and writes their sessions (`auth.setup.ts`). `--project=mobile`
    // pulls it in through `dependencies` (_doc-lib/playwright.md#docs/test-projects).
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    // The same specs at three viewports (_doc-lib/playwright.md#docs/emulation).
    // `mobile` has touch: Pixel 5 with the viewport of the plan, and the only project that
    // holds the 44px rule (`touch-targets.spec.ts`).
    {
      name: 'mobile',
      dependencies: ['setup'],
      use: { ...devices['Pixel 5'], viewport: { width: 360, height: 740 } },
    },
    {
      name: 'tablet',
      dependencies: ['setup'],
      testIgnore: /touch-targets\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: 'desktop',
      dependencies: ['setup'],
      testIgnore: /touch-targets\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
  // The specs run against the real API (the backend on `E2E_API_URL`, migrated and seeded
  // with the demonstration seed; its `CORS_ORIGINS` must list the origin of the app). In CI
  // both are started here, the app from its build as in production; on a developer machine
  // the app is `vite dev` and a backend already running is reused.
  webServer: [
    {
      command: 'node ace serve',
      cwd: '../../backend',
      url: `${apiUrl()}/storefront/neighborhoods`,
      env: { NODE_ENV: 'development' },
      reuseExistingServer: !inCI,
      timeout: 120 * 1000,
    },
    {
      command: appCommands[`${inCI}`],
      cwd: '..',
      url: baseURL,
      env: {
        VITE_API_URL: apiUrl(),
        VITE_SITE_URL: baseURL,
        HOST: 'localhost',
        PORT: port,
        STORAGE_PUBLIC_URL:
          process.env.STORAGE_PUBLIC_URL ?? process.env.STORAGE_ENDPOINT ?? '',
      },
      reuseExistingServer: !inCI,
      timeout: 120 * 1000,
    },
  ],
})
