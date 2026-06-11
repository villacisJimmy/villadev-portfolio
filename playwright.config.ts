import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env["CI"];
const e2eBaseURL = process.env["E2E_BASE_URL"];
const baseURL = e2eBaseURL ?? "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  ...(isCI ? { workers: 1 } : {}),
  reporter: isCI ? "github" : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  ...(e2eBaseURL
    ? {}
    : {
        webServer: {
          command: "npm run start",
          url: "http://127.0.0.1:3000",
          reuseExistingServer: !isCI,
          timeout: 120_000,
        },
      }),
});
