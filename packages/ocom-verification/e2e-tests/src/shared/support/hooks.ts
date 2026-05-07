import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ITestCaseHookParameter, IWorld } from '@cucumber/cucumber';
import { After, AfterAll, Before, Status, setDefaultTimeout } from '@cucumber/cucumber';
import { getTimeout } from '@ocom-verification/verification-shared/settings';
import { type CellixE2EWorld, stopSharedServers } from '../../world.ts';
import { BrowseTheWeb } from '../abilities/browse-the-web.ts';
import { getServerDiagnostics, probeApiHealth } from './shared-infrastructure.ts';

type PlaywrightPage = BrowseTheWeb['page'];

const consoleMessagesByPage = new WeakMap<PlaywrightPage, string[]>();

function indent(text: string, prefix: string): string {
	return text
		.split('\n')
		.map((line) => prefix + line)
		.join('\n');
}

type ConsoleMessageLike = { type(): string; text(): string };
type RequestLike = {
	method(): string;
	url(): string;
	failure(): { errorText: string } | null;
	headers(): Record<string, string>;
	postData(): string | null;
};
type ResponseLike = {
	status(): number;
	url(): string;
	request(): RequestLike;
	text(): Promise<string>;
};

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
	page.on('response', async (res: ResponseLike) => {
		const status = res.status();
		if (status < 400) return;
		const req = res.request();
		const url = res.url();
		// Skip noisy static-asset 404s (favicons, source maps, vite client probes)
		// to keep the diagnostic focused on API/data calls.
		const isStaticNoise = /\.(ico|png|svg|map|webp|woff2?)(\?|$)/i.test(url);
		if (isStaticNoise) {
			buffer.push(`[response ${status}] ${req.method()} ${url}`);
			return;
		}
		let body = '';
		try {
			body = (await res.text()).slice(0, 500);
		} catch (err) {
			body = `<body unavailable: ${err instanceof Error ? err.message : 'unknown'}>`;
		}
		const reqBody = req.postData()?.slice(0, 300) ?? '';
		const reqHeaders = req.headers();
		const interestingHeaders = ['authorization', 'content-type', 'x-community-id', 'x-member-id', 'apollographql-client-name'];
		const headerSummary = interestingHeaders
			.map((h) => (reqHeaders[h] ? `${h}=${h === 'authorization' ? `${reqHeaders[h].slice(0, 20)}…(len=${reqHeaders[h].length})` : reqHeaders[h]}` : null))
			.filter(Boolean)
			.join(', ');
		buffer.push(`[response ${status}] ${req.method()} ${url}\n    req-headers: ${headerSummary}\n    req-body: ${reqBody}\n    res-body: ${body}`);
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
				const apiHealth = await probeApiHealth();
				const serverDiagnostics = getServerDiagnostics();
				const serverSummary = serverDiagnostics
					.map((s) => {
						const exitDesc = s.exitInfo ? `EXITED code=${s.exitInfo.code} signal=${s.exitInfo.signal}` : s.alive ? `alive pid=${s.pid}` : 'no process';
						const stderrTail = s.stderrTail.trim() ? `\n    stderr-tail:\n${indent(s.stderrTail.slice(-2000), '      ')}` : '';
						const stdoutTail = s.stdoutTail.trim() ? `\n    stdout-tail:\n${indent(s.stdoutTail.slice(-1500), '      ')}` : '';
						return `  - ${s.name}: ${exitDesc}${stderrTail}${stdoutTail}`;
					})
					.join('\n');
				const diagnostic = [
					`=== E2E FAILURE DIAGNOSTICS: ${pickle.name} ===`,
					`URL: ${url}`,
					`Title: ${title}`,
					`Script tags: ${JSON.stringify(scriptSrcs)}`,
					`#root innerHTML (first 1000 chars): ${rootHtml.slice(0, 1000)}`,
					`Headings: ${JSON.stringify(headings)}`,
					`Input placeholders: ${JSON.stringify(placeholders)}`,
					`Body text (first 500 chars): ${bodyText.slice(0, 500)}`,
					`API health probe at failure: ${JSON.stringify(apiHealth)}`,
					`Subprocess diagnostics:\n${serverSummary}`,
					`Browser console (last 50 messages):`,
					...consoleLog.slice(-50),
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
