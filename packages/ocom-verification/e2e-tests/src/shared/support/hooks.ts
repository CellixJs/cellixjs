import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ITestCaseHookParameter, IWorld } from '@cucumber/cucumber';
import { After, AfterAll, Before, Status, setDefaultTimeout } from '@cucumber/cucumber';
import { getTimeout } from '@ocom-verification/verification-shared/settings';
import { type CellixE2EWorld, stopSharedServers } from '../../world.ts';
import { BrowseTheWeb } from '../abilities/browse-the-web.ts';

type PlaywrightPage = BrowseTheWeb['page'];

const consoleMessagesByPage = new WeakMap<PlaywrightPage, string[]>();

type ConsoleMessageLike = { type(): string; text(): string };
type RequestLike = { method(): string; url(): string; failure(): { errorText: string } | null };

export function attachConsoleCapture(page: PlaywrightPage): void {
	const buffer: string[] = [];
	consoleMessagesByPage.set(page, buffer);
	page.on('console', (msg: ConsoleMessageLike) => {
		buffer.push(`[${msg.type()}] ${msg.text()}`);
	});
	page.on('pageerror', (err: Error) => {
		buffer.push(`[pageerror] ${err.message}`);
	});
	page.on('requestfailed', (req: RequestLike) => {
		buffer.push(`[requestfailed] ${req.method()} ${req.url()} — ${req.failure()?.errorText ?? 'unknown'}`);
	});
}

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
		const browseTheWeb = BrowseTheWeb.current();

		try {
			if (browseTheWeb) {
				const reportsDir = path.resolve(currentDir, '..', '..', '..', 'reports', 'screenshots');
				fs.mkdirSync(reportsDir, { recursive: true });

				const safeName = pickle.name.replaceAll(/[^a-zA-Z0-9-_]/g, '_').slice(0, 80);
				const timestamp = new Date().toISOString().replaceAll(/[:.]/g, '-');
				const screenshotPath = path.join(reportsDir, `${safeName}-${timestamp}.png`);

				await browseTheWeb.page.screenshot({ path: screenshotPath, fullPage: true });
				this.attach(fs.readFileSync(screenshotPath), 'image/png');
			}
		} catch {
			/* Screenshot capture is best-effort */
		}

		try {
			if (browseTheWeb) {
				const { page } = browseTheWeb;
				const url = page.url();
				const title = await page.title().catch(() => '<title unavailable>');
				const rootHtml = await page
					.locator('#root')
					.innerHTML({ timeout: 1_000 })
					.catch(() => '<#root unavailable>');
				const scriptSrcs = await page
					.locator('script[src]')
					.evaluateAll((els: Element[]) => els.map((el) => (el as HTMLScriptElement).src))
					.catch(() => [] as string[]);
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
				const consoleLog = consoleMessagesByPage.get(page) ?? [];
				const diagnostic = [
					`=== E2E FAILURE DIAGNOSTICS: ${pickle.name} ===`,
					`URL: ${url}`,
					`Title: ${title}`,
					`Script tags: ${JSON.stringify(scriptSrcs)}`,
					`#root innerHTML (first 1000 chars): ${rootHtml.slice(0, 1000)}`,
					`Headings: ${JSON.stringify(headings)}`,
					`Input placeholders: ${JSON.stringify(placeholders)}`,
					`Body text (first 500 chars): ${bodyText.slice(0, 500)}`,
					`Browser console (last 30 messages):`,
					...consoleLog.slice(-30),
					'=== END DIAGNOSTICS ===',
				].join('\n');
				this.attach(diagnostic, 'text/plain');
				process.stderr.write(`\n${diagnostic}\n`);
			}
		} catch {
			/* Diagnostic capture is best-effort */
		}
	}

	await world.cleanup();
});

AfterAll(async () => {
	await stopSharedServers();
});
