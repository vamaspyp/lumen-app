import { defineConfig, devices } from '@playwright/test'

// Puerto fijo con --strictPort: si Vite eligiera otro puerto en automático
// (p.ej. porque el 5173 está ocupado), Playwright quedaría apuntando a la
// URL equivocada. --strictPort hace fallar el arranque en vez de migrar de
// puerto en silencio.
const PORT = 5183
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: BASE_URL,
    // La intro animada de LUMEN (~7.5s) ya respeta prefers-reduced-motion
    // (ver src/components/LumenIntro.tsx); se activa acá para que el smoke
    // no dependa del timing de esa animación.
    reducedMotion: 'reduce',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
