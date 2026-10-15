import { defineConfig, devices } from '@playwright/test'

// Fixed port + --strictPort keeps E2E deterministic: if the port is occupied,
// fail instead of silently testing a different local server.
const PORT = 5183
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    proxy:process.env.PLAYWRIGHT_PROXY_SERVER?{server:process.env.PLAYWRIGHT_PROXY_SERVER,bypass:'localhost,127.0.0.1'}:undefined,
    reducedMotion: 'reduce',
    ignoreHTTPSErrors:Boolean(process.env.PLAYWRIGHT_PROXY_SERVER),
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? {executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE} : {},
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    // verify builds immediately before E2E; test the deployable artifact, not Vite dev.
    command: `npm run preview -- --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
