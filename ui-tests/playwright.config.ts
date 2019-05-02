import type { PlaywrightTestConfig } from "@playwright/test"
import { devices } from "@playwright/test"

declare const process: {
	env: {
		CI?: string
		ALL_BROWSERS?: string
	}
}

const isCI = process.env.CI === "1"
const serverPort = 3040

/* Configure projects for major browsers */
const projects = [
	{
		name: "chromium",
		use: {
			...devices["Desktop Chrome"],
		},
	},
]

if (isCI || process.env.ALL_BROWSERS === "1") {
	projects.push(
		{
			name: "firefox",
			use: {
				...devices["Desktop Firefox"],
			},
		},
		{
			name: "webkit",
			use: {
				...devices["Desktop Safari"],
			},
		},
	)
}

const config: PlaywrightTestConfig = {
	testDir: "./tests",
	/* Maximum time one test can run for. */
	timeout: 30 * 1000,
	expect: {
		/**
		 * Maximum time expect() should wait for the condition to be met.
		 * For example in `await expect(locator).toHaveText();`
		 */
		timeout: 5000,
	},
	/* Run tests in files in parallel */
	fullyParallel: true,
	/* Fail the build on CI if you accidentally left test.only in the source code. */
	forbidOnly: isCI,
	/* Retry on CI only */
	retries: isCI ? 2 : 0,
	/* Opt out of parallel tests on CI. */
	workers: isCI ? 1 : undefined,

	/* Reporter to use. See https://playwright.dev/docs/test-reporters */
	reporter: [
