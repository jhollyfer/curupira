import { defineConfig, devices } from '@playwright/test'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

// `.env.e2e` is optional: in CI the variables come from the environment. It loads before
// the rest of the config, because `webServer` and `baseURL` read `process.env`.
const envFile = resolve(import.meta.dirname, '..', '.env.e2e')
if (existsSync(envFile)) process.loadEnvFile(envFile)

const port = process.env.E2E_PORT ?? '3010'
const baseURL = `http://localhost:${port}`

/**
 * `E2E_WORKERS` wins; otherwise 4 in CI, where the runner is dedicated, and 2 on a
 * developer machine, which is also running the app.
 */
function workerCount(): number {
  const fromEnv = Number(process.env.E2E_WORKERS)
  if (Number.isInteger(fromEnv) && fromEnv > 0) return fromEnv
  if (process.env.CI) return 4
  return 2
}

// https://playwright.dev/docs/test-configuration
export default defineConfig({
  testDir: '.',
  outputDir: '../test-results',
  forbidOnly: Boolean(process.env.CI),
  // Unconditional retry turns a broken test into a flaky one
  // (_doc-lib/playwright.md#docs/test-retries).
  retries: 0,
  // Parallel only where it is safe. The flows (report, panel, panel matrix) write to the
  // database and spend the API's login and report limits, so they are chained with
  // `dependencies` and never overlap; the public matrix only reads pages and runs beside
  // them. Without this the matrix (about 150 navigations) ran alone in one worker and
  // alone took longer than the whole job's cap.
  workers: workerCount(),
  // Without a global cap, a job killed by the provider produces no report
  // (_doc-lib/playwright.md#docs/test-timeouts). Room for the slowest cold run, not a cure:
  // the suite is expected to finish well under it.
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
    // The resident app is a phone app: the flows run in a phone-sized viewport.
    {
      name: 'mobile',
      testMatch: /report-flow\.spec\.ts/,
      use: { ...devices['Pixel 7'] },
    },
    // The panel flows run in a desktop viewport. They wait for the resident flow: both
    // log in and file reports, and the sign-in allows 5 attempts a minute per IP.
    {
      name: 'desktop',
      testMatch: /management-flow\.spec\.ts/,
      dependencies: ['mobile'],
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
    // The public matrix runs twice: with touch (the page overflow and the 44px targets are
    // asserted) and with a mouse (only the overflow: the spec reads `hasTouch`). It reads
    // pages and writes nothing, so every test is independent and runs in parallel.
    {
      name: 'responsive-touch',
      testMatch: /responsive-public\.spec\.ts/,
      fullyParallel: true,
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'responsive-pointer',
      testMatch: /responsive-public\.spec\.ts/,
      fullyParallel: true,
      use: { ...devices['Desktop Chrome'] },
    },
    // The panel at every width of the matrix: the spec sets its own viewport per test.
    // It signs in (one session per worker), so it runs alone, after the panel flows.
    {
      name: 'responsive',
      testMatch: /responsive-panel\.spec\.ts/,
      dependencies: ['desktop'],
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // The specs run against the real API (backend on `E2E_API_URL`, seeded with
    // `db:seed:demo`; its `SITE_URL` must be this server's origin).
    command: `pnpm exec vite dev --port ${port} --strictPort`,
    cwd: '..',
    url: baseURL,
    env: {
      VITE_DATA_SOURCE: 'api',
      VITE_API_URL: process.env.E2E_API_URL ?? 'http://localhost:3333',
      VITE_SITE_URL: baseURL,
    },
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})
