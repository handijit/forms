import { defineConfig, devices } from "@playwright/test";

/**
 * The browser test: the sample form (e2e/app) on the package's sources and @handijit/ui, in a
 * real Chromium, in the light and the dark theme. Screenshots go to e2e/out/ for a person to
 * look at; nothing is compared pixel by pixel.
 */
export default defineConfig({
  testDir: "./e2e",
  outputDir: "./test-results",
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: process.env.CI ? "line" : "list",
  use: {
    baseURL: "http://localhost:5281",
    ...devices["Desktop Chrome"],
    viewport: { width: 1000, height: 900 },
  },
  projects: [{ name: "chromium" }],
  webServer: {
    command: "npx vite --config e2e/vite.config.mts",
    url: "http://localhost:5281",
    reuseExistingServer: !process.env.CI,
    env: { VITE_CONFIG_NATIVE_IGNORE_WARNING: "true" },
  },
});
