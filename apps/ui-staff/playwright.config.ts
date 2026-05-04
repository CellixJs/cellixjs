import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright e2e configuration for the ui-staff portal.
 * Tests inject OIDC sessions into sessionStorage directly — no real auth flow required.
 * The dev server must be running (`pnpm run dev`) before executing these tests.
 */
export default defineConfig({
	testDir: './e2e',
	fullyParallel: false,
	retries: 0,
	reporter: 'list',
	use: {
		baseURL: 'https://staff.ownercommunity.localhost:1355',
		ignoreHTTPSErrors: true,
		trace: 'on-first-retry',
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
});
