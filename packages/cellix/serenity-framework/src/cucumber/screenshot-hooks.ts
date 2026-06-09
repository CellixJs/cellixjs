import { mkdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { After, type ITestCaseHookParameter, type IWorld, Status } from '@cucumber/cucumber';
import { BrowseTheWeb } from '../serenity/browse-the-web.ts';

/** Options used by {@link registerScreenshotOnFailureHook}. */
export interface ScreenshotOnFailureOptions {
	/** Directory where screenshots should be written. */
	reportsDir: string;

	/** Whether to capture screenshots on failure. Defaults to `false`. */
	enabled?: boolean;

	/** Ability provider. Defaults to `BrowseTheWeb.current()`. */
	getBrowseTheWeb?: () => BrowseTheWeb | undefined;
}

/**
 * Register a Cucumber `After` hook that captures a Playwright screenshot on failure.
 *
 * The hook is best-effort: screenshot failures are swallowed so the original
 * scenario failure remains the primary signal.
 *
 * @param options Screenshot directory and optional browser ability provider.
 */
export function registerScreenshotOnFailureHook(options: ScreenshotOnFailureOptions): void {
	if (!options.enabled) return;

	After(async function (this: IWorld, { result, pickle }: ITestCaseHookParameter) {
		if (result?.status !== Status.FAILED) {
			return;
		}

		try {
			const browseTheWeb = options.getBrowseTheWeb?.() ?? BrowseTheWeb.current();
			if (!browseTheWeb) {
				return;
			}

			const reportsDir = resolve(options.reportsDir);
			mkdirSync(reportsDir, { recursive: true });

			const safeName = pickle.name.replaceAll(/[^a-zA-Z0-9-_]/g, '_').slice(0, 80);
			const timestamp = new Date().toISOString().replaceAll(/[:.]/g, '-');
			const screenshotPath = join(reportsDir, `${safeName}-${timestamp}.png`);

			await browseTheWeb.page.screenshot({ path: screenshotPath, fullPage: true });
			this.attach(readFileSync(screenshotPath), 'image/png');
		} catch {
			/* Screenshot capture is best-effort. */
		}
	});
}
