import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { checkSerenitySuiteConventions } from './serenity.js';

const temporaryDirectories: string[] = [];

afterEach(async () => {
	await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { force: true, recursive: true })));
});

async function write(root: string, relativePath: string, content: string): Promise<void> {
	const filePath = path.join(root, relativePath);
	await mkdir(path.dirname(filePath), { recursive: true });
	await writeFile(filePath, content);
}

async function suiteFixture(): Promise<string> {
	const suiteRoot = await mkdtemp(path.join(tmpdir(), 'cellix-serenity-'));
	temporaryDirectories.push(suiteRoot);
	await write(
		suiteRoot,
		'world.ts',
		`import { registerManagedSerenityWorld } from '@cellix/serenity-framework/cucumber';\nimport { SerenityCast } from '@cellix/serenity-framework/serenity';\nimport { infrastructure } from './infrastructure.ts';\nexport const TestWorld = registerManagedSerenityWorld({ infrastructure, createCast: () => new SerenityCast({ useNotepad: true }) });\nexport type TestWorld = InstanceType<typeof TestWorld>;\nregisterLifecycleHooks();`,
	);
	await write(
		suiteRoot,
		'cucumber-lifecycle-hooks.ts',
		`import { registerWorldLifecycleHooks } from '@cellix/serenity-framework/cucumber';\nimport { getTimeout } from '@cellix/serenity-framework/settings';\nregisterWorldLifecycleHooks({ scenarioTimeout: getTimeout('scenario'), before: async (world) => world.init(), after: async (world) => world.cleanup(), afterAll: () => infrastructure.stopAll() });`,
	);
	await write(suiteRoot, 'step-definitions/index.ts', `import '../contexts/community/step-definitions/index.ts';`);
	await write(suiteRoot, 'contexts/community/step-definitions/index.ts', `import './create-community.steps.ts';`);
	await write(
		suiteRoot,
		'contexts/community/step-definitions/create-community.steps.ts',
		`import { Given, When, Then } from '@cucumber/cucumber';\nimport { CreateCommunity } from '../tasks/create-community.ts';\nimport { CommunityName } from '../questions/community-name.ts';\nWhen('creates', async () => actor.attemptsTo(CreateCommunity()));\nThen('created', async () => actor.answer(CommunityName()));`,
	);
	await write(suiteRoot, 'contexts/community/tasks/create-community.ts', `import { Interaction } from '@serenity-js/core';\nexport const CreateCommunity = () => Interaction.where('creates', async () => undefined);`);
	await write(suiteRoot, 'contexts/community/questions/community-name.ts', `import { Question } from '@serenity-js/core';\nexport const CommunityName = () => Question.about('name', () => 'Cellix');`);
	await write(
		suiteRoot,
		'infrastructure.ts',
		`import { E2EInfrastructure } from '@cellix/serenity-framework/infrastructure/e2e';
export const infrastructure = E2EInfrastructure.create()
  .addServer('api', apiServer)
  .addUiPortal('community', communityPortal, { dependsOn: ['api'] })
  .finalize();`,
	);
	return suiteRoot;
}

describe('Serenity convention public contract', () => {
	it('accepts managed lifecycle and context-owned Screenplay abstractions', async () => {
		const suiteRoot = await suiteFixture();
		expect(await checkSerenitySuiteConventions({ suiteRoot, requireManagedCleanup: true })).toStrictEqual([]);
	});

	it('reports missing context indexes and steps that contain behavior directly', async () => {
		const suiteRoot = await suiteFixture();
		await write(suiteRoot, 'step-definitions/index.ts', '');
		await write(suiteRoot, 'contexts/community/step-definitions/create-community.steps.ts', `import { When } from '@cucumber/cucumber';\nWhen('creates', async () => fetch('/graphql'));`);

		const violations = await checkSerenitySuiteConventions({ suiteRoot });
		expect(violations).toEqual(expect.arrayContaining([expect.stringContaining('Central loader'), expect.stringContaining('delegate behavior')]));
	});

	it('reports a suite with no discoverable contexts', async () => {
		const suiteRoot = await suiteFixture();
		await rm(path.join(suiteRoot, 'contexts'), { recursive: true });

		expect(await checkSerenitySuiteConventions({ suiteRoot })).toContain(`[${path.join(suiteRoot, 'contexts')}] Serenity suite must define at least one context directory`);
	});

	it('reports managed infrastructure without concrete server and UI portal registration', async () => {
		const suiteRoot = await suiteFixture();
		await write(suiteRoot, 'infrastructure.ts', `import { E2EInfrastructure } from '@cellix/serenity-framework/infrastructure/e2e';\nexport const infrastructure = E2EInfrastructure.create().finalize();`);

		const violations = await checkSerenitySuiteConventions({ suiteRoot, requireManagedCleanup: true });
		expect(violations).toEqual(expect.arrayContaining([expect.stringContaining('at least one server'), expect.stringContaining('at least one UI portal')]));
	});
});
