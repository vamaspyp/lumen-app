import { defineConfig, devices } from '@playwright/test'

// Fixed port + --strictPort keeps E2E deterministic: if the port is occupied,
// fail instead of silently testing a different local server.
const PORT = 5183
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: BASE_URL,
    reducedMotion: 'reduce',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    // verify builds immediately before E2E; test the deployable artifact, not Vite dev.
    command: `npm run preview -- --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
