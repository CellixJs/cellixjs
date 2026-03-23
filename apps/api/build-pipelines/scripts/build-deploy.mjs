/**
 * Deployment artifact preparation script for @ocom/api.
 *
 * Copies the Azure Functions host.json and writes a minimal package.json into
 * the deploy/ directory after rolldown has produced the bundled asset.
 * The deploy/ directory is the self-contained artifact used for both local
 * Azure Functions development and CI/CD deployment.
 *
 * Usage: node apps/api/build-pipelines/scripts/build-deploy.mjs
 * Prerequisites: `pnpm run build` must have already run (tsc + rolldown → deploy/dist/index.js).
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const apiDir = path.resolve(__dirname, '..', '..');
const deployDir = path.join(apiDir, 'deploy');
const bundleEntry = path.join(deployDir, 'dist/index.js');
const packageJsonPath = path.join(apiDir, 'package.json');
const hostJsonPath = path.join(apiDir, 'host.json');

await fs.access(bundleEntry).catch(() => {
	throw new Error(
		`Bundled entry not found at ${bundleEntry}. Run 'pnpm run build' before 'pnpm run prepare:deploy'.`,
	);
});

await Promise.all([
	fs.copyFile(hostJsonPath, path.join(deployDir, 'host.json')),
	writeDeployPackageJson(),
]);

async function writeDeployPackageJson() {
	const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
	const deployPackageJson = {
		name: packageJson.name,
		version: packageJson.version,
		private: true,
		type: 'module',
		main: 'dist/index.js',
	};

	await fs.writeFile(
		path.join(deployDir, 'package.json'),
		`${JSON.stringify(deployPackageJson, null, 2)}\n`,
	);
}
