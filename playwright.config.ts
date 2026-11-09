import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

/**
 * Smoke test for the three acceptance flows, online and offline, against a
 * production build. Runs in local-storage mode (Firebase env blanked) so it
 * needs no account; Firestore sync is covered by unit tests and manual checks.
 */
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'mobile-chrome', use: { ...devices['Pixel 7'] } }],
  webServer: {
    command: `npx vite build --outDir dist-local && npx vite preview --outDir dist-local --port ${PORT} --strictPort`,
    env: { VITE_FIREBASE_API_KEY: '', VITE_FIREBASE_PROJECT_ID: '', VITE_FIREBASE_APP_ID: '' },
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
