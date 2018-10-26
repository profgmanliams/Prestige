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
