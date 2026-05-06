import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ITestCaseHookParameter, IWorld } from '@cucumber/cucumber';
import { After, AfterAll, Before, Status, setDefaultTimeout } from '@cucumber/cucumber';
import { getTimeout } from '@ocom-verification/verification-shared/settings';
import { type CellixE2EWorld, stopSharedServers } from '../../world.ts';
import { BrowseTheWeb } from '../abilities/browse-the-web.ts';

const currentDir = fileURLToPath(new URL('.', import.meta.url));

/** Default scenario timeout from centralized configuration */
setDefaultTimeout(getTimeout('scenario'));

Before(async function (this: IWorld) {
	const world = this as IWorld & CellixE2EWorld;
	await world.init();
});

After(async function (this: IWorld, { result, pickle }: ITestCaseHookParameter) {
	const world = this as IWorld & CellixE2EWorld;

	if (result?.status === Status.FAILED) {
		try {
			const browseTheWeb = BrowseTheWeb.current();
			if (browseTheWeb) {
				const reportsDir = path.resolve(currentDir, '..', '..', '..', 'reports', 'screenshots');
				fs.mkdirSync(reportsDir, { recursive: true });

				const safeName = pickle.name.replaceAll(/[^a-zA-Z0-9-_]/g, '_').slice(0, 80);
				const timestamp = new Date().toISOString().replaceAll(/[:.]/g, '-');
				const screenshotPath = path.join(reportsDir, `${safeName}-${timestamp}.png`);

				await browseTheWeb.page.screenshot({ path: screenshotPath, fullPage: true });
				this.attach(fs.readFileSync(screenshotPath), 'image/png');

				// Diagnostic dump to stdout — visible in CI logs when screenshot artifacts aren't accessible
				const { page } = browseTheWeb;
				const url = page.url();
				const title = await page.title().catch(() => '<title unavailable>');
				const bodyText = await page
					.locator('body')
					.innerText({ timeout: 1_000 })
					.catch(() => '<body text unavailable>');
				const placeholders = await page
					.locator('input, textarea')
					.evaluateAll((els: Element[]) => els.map((el) => (el as HTMLInputElement | HTMLTextAreaElement).placeholder || '<no placeholder>'))
					.catch(() => [] as string[]);
				const headings = await page
					.locator('h1, h2, h3')
					.allTextContents()
					.catch(() => []);
				console.log(`\n=== E2E FAILURE DIAGNOSTICS: ${pickle.name} ===`);
				console.log(`URL: ${url}`);
				console.log(`Title: ${title}`);
				console.log(`Headings: ${JSON.stringify(headings)}`);
				console.log(`Input placeholders: ${JSON.stringify(placeholders)}`);
				console.log(`Body text (first 500 chars): ${bodyText.slice(0, 500)}`);
				console.log(`=== END DIAGNOSTICS ===\n`);
			}
		} catch {
			/* Screenshot capture is best-effort */
		}
	}

	await world.cleanup();
});

AfterAll(async () => {
	await stopSharedServers();
});
