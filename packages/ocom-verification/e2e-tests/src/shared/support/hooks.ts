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
		// Filter to high-signal levels — debug/info/log are mostly Vite/HMR/Apollo
		// devtools noise that pushes interesting lines out of the tail.
		const type = msg.type();
		if (type === 'error' || type === 'warning') {
			buffer.push(`[${type}] ${msg.text().slice(0, 300)}`);
		}
	});
	page.on('pageerror', (err: Error) => {
		buffer.push(`[pageerror] ${err.message.slice(0, 300)}`);
	});
	page.on('requestfailed', (req: RequestLike) => {
		buffer.push(`[requestfailed] ${req.method()} ${req.url()} — ${req.failure()?.errorText ?? 'unknown'}`);
	});
	page.on('response', async (res: ResponseLike) => {
		const status = res.status();
		if (status < 400) return;
		const req = res.request();
		const url = res.url();
		const isStaticNoise = /\.(ico|png|svg|map|webp|woff2?)(\?|$)/i.test(url);
		if (isStaticNoise) {
			buffer.push(`[response ${status}] ${req.method()} ${url}`);
			return;
		}
		let body = '';
		try {
			body = (await res.text()).slice(0, 200);
		} catch (err) {
			body = `<body unavailable: ${err instanceof Error ? err.message : 'unknown'}>`;
		}
		const reqHeaders = req.headers();
		const authHeader = reqHeaders['authorization'];
		const auth = authHeader ? `auth(len=${authHeader.length})` : 'no-auth';
		const ct = reqHeaders['content-type'] ?? 'no-ct';
		const reqBodyHead = (req.postData() ?? '').slice(0, 60);
		buffer.push(`[response ${status}] ${req.method()} ${url} | ${auth} ct=${ct} | reqStart=${reqBodyHead} | resBody=${body || '<empty>'}`);
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
						const stderrTail = s.stderrTail.trim() ? `\n    stderr-tail:\n${indent(s.stderrTail.slice(-1200), '      ')}` : '';
						return `  - ${s.name}: ${exitDesc}${stderrTail}`;
					})
					.join('\n');
				// Critical info (API health, subprocess state) is placed AT THE END
				// of the diagnostic block so it survives Azure DevOps log display
				// head-truncation. Less critical context is at the top.
				const diagnostic = [
					`=== E2E FAILURE DIAGNOSTICS: ${pickle.name} ===`,
					`URL: ${url}`,
					`Title: ${title}`,
					`Headings: ${JSON.stringify(headings)}`,
					`Input placeholders: ${JSON.stringify(placeholders)}`,
					`Body text (first 200 chars): ${bodyText.slice(0, 200)}`,
					`Browser console (last 25 errors/warnings/responses):`,
					...consoleLog.slice(-25),
					'',
					`>>> CRITICAL: API HEALTH PROBE AT FAILURE: ${JSON.stringify(apiHealth)}`,
					`>>> CRITICAL: SUBPROCESS DIAGNOSTICS:\n${serverSummary}`,
					'=== END DIAGNOSTICS ===',
				].join('\n');
				this.attach(diagnostic, 'text/plain');
				process.stderr.write(`\n${diagnostic}\n`);

				// Belt-and-suspenders: emit critical lines individually so they
				// survive log-display truncation that may swallow the larger
				// cucumber attachment.
				process.stderr.write(`\n[E2E-CRITICAL ${pickle.name}] api-health=${JSON.stringify(apiHealth)}\n`);
				for (const s of serverDiagnostics) {
					const exitDesc = s.exitInfo ? `EXITED code=${s.exitInfo.code} signal=${s.exitInfo.signal}` : s.alive ? `alive pid=${s.pid}` : 'no process';
					process.stderr.write(`[E2E-CRITICAL ${pickle.name}] subprocess ${s.name}: ${exitDesc}\n`);
					if (s.stderrTail.trim()) {
						const lines = s.stderrTail.slice(-1200).split('\n');
						for (const line of lines) {
							process.stderr.write(`[E2E-CRITICAL ${s.name} stderr] ${line.slice(0, 400)}\n`);
						}
					}
				}
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
