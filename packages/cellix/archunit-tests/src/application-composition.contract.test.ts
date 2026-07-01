import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { checkApiComposition } from './api.js';
import { checkUiAppComposition } from './ui-app.js';

const temporaryDirectories: string[] = [];

afterEach(async () => {
	await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { force: true, recursive: true })));
});

async function fixture(fileName: string, content: string): Promise<string> {
	const directory = await mkdtemp(path.join(tmpdir(), 'cellix-archunit-'));
	temporaryDirectories.push(directory);
	const filePath = path.join(directory, fileName);
	await mkdir(path.dirname(filePath), { recursive: true });
	await writeFile(filePath, content);
	return filePath;
}

describe('application composition public contracts', () => {
	it('accepts a complete Cellix API startup chain', async () => {
		const apiIndexPath = await fixture(
			'index.ts',
			`import { Cellix } from './cellix.ts';
Cellix.initializeInfrastructureServices((registry) => registry.registerInfrastructureService(service))
  .setContext((registry) => { return { registry }; })
  .initializeApplicationServices((context) => build(context))
  .registerAzureFunctionHttpHandler('graphql', {}, handler)
			  .startUp();`,
		);
		await writeFile(
			path.join(path.dirname(apiIndexPath), 'cellix.ts'),
			`export class Cellix {
  private setupLifecycle() {
    app.hook.appStart(async () => {
      await this.startAllServicesWithTracing();
      this.contextInternal = this.contextCreatorInternal(this);
      this.appServicesHostInternal = this.appServicesHostBuilder(this.contextInternal);
    });
  }
  private async startAllServicesWithTracing() {
    await Promise.all(this.services.map((service) => service.startUp()));
  }
}`,
		);

		expect(await checkApiComposition({ apiIndexPath })).toStrictEqual([]);
	});

	it('reports omitted and out-of-order API startup stages', async () => {
		const apiIndexPath = await fixture('index.ts', `import { Cellix } from './cellix.ts';\nCellix.startUp().setContext(() => ({}));`);

		const violations = await checkApiComposition({ apiIndexPath });
		expect(violations).toEqual(expect.arrayContaining([expect.stringContaining('initializeInfrastructureServices'), expect.stringContaining('initializeApplicationServices'), expect.stringContaining('registerAzureFunction')]));
	});

	it('reports a Cellix implementation that does not initialize infrastructure during app startup', async () => {
		const apiIndexPath = await fixture(
			'index.ts',
			`import { Cellix } from './cellix.ts';
Cellix.initializeInfrastructureServices((registry) => registry.registerInfrastructureService(service))
  .setContext((registry) => { return { registry }; })
  .initializeApplicationServices((context) => build(context))
  .registerAzureFunctionHttpHandler('graphql', {}, handler)
  .startUp();`,
		);
		await writeFile(path.join(path.dirname(apiIndexPath), 'cellix.ts'), `export class Cellix { private setupLifecycle() { app.hook.appStart(async () => this.buildContext()); } }`);

		expect(await checkApiComposition({ apiIndexPath })).toEqual(expect.arrayContaining([expect.stringContaining('registered infrastructure services during appStart')]));
	});

	it('accepts a UI bootstrap with the configured providers and routed app', async () => {
		const appRoot = path.dirname(
			await fixture(
				'src/main.tsx',
				`import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
const root = document.getElementById('root');
if (!root) throw new Error('missing root');
createRoot(root).render(<React.StrictMode><ThemeProvider><BrowserRouter><App /></BrowserRouter></ThemeProvider></React.StrictMode>);`,
			),
		);
		await writeFile(path.join(appRoot, 'App.tsx'), `import { Routes, Route } from 'react-router-dom';\nexport default () => <Routes><Route path="/" element={<Home />} /></Routes>;`);

		expect(await checkUiAppComposition({ appRoot, requiredProviders: ['ThemeProvider', 'BrowserRouter'] })).toStrictEqual([]);
	});

	it('reports a UI entrypoint that skips root validation, providers, or routing', async () => {
		const appRoot = path.dirname(await fixture('src/main.tsx', `import { createRoot } from 'react-dom/client';\ncreateRoot(document.getElementById('root')).render(<App />);`));
		await writeFile(path.join(appRoot, 'App.tsx'), 'export default () => <main />;');

		const violations = await checkUiAppComposition({ appRoot, requiredProviders: ['ThemeProvider'] });
		expect(violations).toEqual(expect.arrayContaining([expect.stringContaining('guard'), expect.stringContaining('ThemeProvider'), expect.stringContaining('Routes')]));
	});
});
