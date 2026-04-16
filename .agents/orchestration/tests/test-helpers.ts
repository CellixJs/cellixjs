import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { afterEach } from 'vitest';

const temporaryDirectories: string[] = [];

export function repoRoot(): string {
	return resolve(__dirname, '../../../');
}

export function createTempRepoFixture(specContents?: string): string {
	const root = mkdtempSync(join(tmpdir(), 'cellix-orchestration-'));
	temporaryDirectories.push(root);

	copyFile(root, '.agents/orchestration/model/orchestration-model.v1.json');
	copyFile(root, '.agents/orchestration/hooks/hook-manifest.json');
	copyFile(root, '.agents/orchestration/cli/orchestration-hook.ts');
	copyFile(root, '.agents/orchestration/cli/validate-orchestration.ts');
	copyFile(root, '.agents/orchestration/lib/types.ts');
	copyFile(root, '.agents/orchestration/lib/yaml-lite.ts');
	copyFile(root, '.agents/orchestration/lib/orchestration-loader.ts');
	copyFile(root, '.agents/orchestration/lib/orchestration-runtime.ts');
	copyFile(root, '.agents/orchestration/lib/orchestration-validator.ts');

	const skills = [
		'cellix-task-intake',
		'cellix-session-state',
		'cellix-feature-delivery',
		'cellix-phase-review',
		'cellix-framework-surface-review',
		'cellix-tdd',
	];

	for (const skill of skills) {
		copyFile(root, `.agents/skills/${skill}/SKILL.md`);
	}

	const agents = ['senior-orchestrator', 'discovery-planner', 'implementation-engineer', 'qa-reviewer', 'framework-surface-reviewer'];
	for (const agent of agents) {
		copyFile(root, `.github/agents/${agent}.agent.md`);
	}

	const defaultSpec =
		specContents ??
		readFileSync(join(repoRoot(), 'orchestration.spec.yaml'), 'utf8');

	writeFixtureFile(root, 'orchestration.spec.yaml', defaultSpec);
	return root;
}

export function writeFixtureFile(root: string, relativePath: string, content: string): void {
	const filePath = join(root, relativePath);
	mkdirSync(dirname(filePath), { recursive: true });
	writeFileSync(filePath, content, 'utf8');
}

function copyFile(root: string, relativePath: string): void {
	writeFixtureFile(root, relativePath, readFileSync(join(repoRoot(), relativePath), 'utf8'));
}

afterEach(() => {
	while (temporaryDirectories.length > 0) {
		const path = temporaryDirectories.pop();
		if (path) {
			rmSync(path, { recursive: true, force: true });
		}
	}
});
