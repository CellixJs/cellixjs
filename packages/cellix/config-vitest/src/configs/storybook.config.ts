import path from 'node:path';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { mergeConfig, type ViteUserConfig } from 'vitest/config';
import { baseConfig, createDefaultTypecheckConfig, defaultTestIncludePatterns } from './base.config.ts';

export type StorybookVitestConfigOptions = {
	storybookDirRelativeToPackage?: string; // default: '.storybook'
	setupFiles?: string[]; // default: ['.storybook/vitest.setup.ts']
	browsers?: { browser: 'chromium' | 'firefox' | 'webkit' }[]; // default: [{ browser: 'chromium' }]
	additionalCoverageExclude?: string[];
};

function getBrowserApiPort(pkgDirname: string): number {
	const hash = Array.from(pkgDirname).reduce((total, char) => {
		return (total * 31 + (char.codePointAt(0) ?? 0)) % 1000;
	}, 0);

	return 64000 + hash;
}

export function createStorybookVitestConfig(pkgDirname: string, opts: StorybookVitestConfigOptions = {}): ViteUserConfig {
	const STORYBOOK_DIR = opts.storybookDirRelativeToPackage ?? '.storybook';
	const setupFiles = opts.setupFiles ?? ['.storybook/vitest.setup.ts'];
	const instances = opts.browsers ?? [{ browser: 'chromium' }];
	const browserApiPort = getBrowserApiPort(pkgDirname);

	return mergeConfig(baseConfig as ViteUserConfig, {
		test: {
			api: {
				host: '127.0.0.1',
				port: browserApiPort,
			},
			globals: true,
			projects: [
				{
					extends: true,
					test: {
						name: 'unit',
						include: [...defaultTestIncludePatterns],
						exclude: ['**/node_modules/**', 'src/archunit-tests/**'],
						environment: 'jsdom',
						typecheck: createDefaultTypecheckConfig(),
					},
				},
				{
					extends: true,
					plugins: [
						storybookTest({
							configDir: path.join(pkgDirname, STORYBOOK_DIR),
						}),
					],
					test: {
						name: 'storybook',
						typecheck: {
							enabled: false,
						},
						browser: {
							enabled: true,
							headless: true,
							provider: playwright(),
							instances,
						},
						setupFiles,
					},
				},
			],
			coverage: {
				include: ['src/**/*.{ts,tsx}'],
				exclude: [
					'**/*.config.ts',
					'**/tsconfig.json',
					'**/.storybook/**',
					'**/*.stories.ts',
					'**/*.stories.tsx',
					'**/*.test.ts',
					'**/*.test.tsx',
					'**/generated.ts',
					'**/generated.tsx',
					'**/coverage/**',
					'**/*.d.ts',
					'dist/**',
					'src/archunit-tests/**',
					...(opts.additionalCoverageExclude ?? []),
				],
			},
		},
	});
}
