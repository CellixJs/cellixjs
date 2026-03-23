/**
 * Builds a CJS alias map for rolldown to work around a rolldown beta panic
 * triggered by ESM star imports (import * as X from 'graphql') in the
 * graphql-ecosystem when workspace packages are in the module graph.
 *
 * Each npm dependency reachable from @ocom/api (through workspace packages) is
 * aliased to its CJS entry point. Using require.resolve() from the workspace
 * package directory that declared the dependency honours the `require` export
 * condition, returning a CJS file path — avoiding the problematic ESM paths.
 *
 * NOTE: Configure the `APPLICATION_NAMESPACE` constant below to match your
 * Cellix project workspace package namespace. The example in this repository
 * uses the `@ocom/` namespace and assumes `@ocom/api` is the top-level
 * application package. Update those values if your project uses a different
 * namespace or entry package.
 */
import { promises as fs } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const APPLICATION_NAMESPACE = '@ocom/';

const require = createRequire(import.meta.url);

/**
 * @param {string} repoRoot - Absolute path to the monorepo root
 * @returns {Promise<Record<string, string>>} alias map of { packageName → absoluteCjsEntryPath }
 */
export async function buildCjsAliasMap(repoRoot) {
	const workspacePackages = await collectWorkspacePackages(repoRoot);
	const externalDeps = await collectExternalDeps('@ocom/api', workspacePackages);
	const alias = {};

	for (const { pkg, fromDir } of externalDeps) {
		if (alias[pkg]) continue;
		try {
			alias[pkg] = require.resolve(pkg, { paths: [fromDir] });
		} catch {
			// Not resolvable from the declaring workspace package dir — skip.
		}
	}

	return alias;
}

async function collectExternalDeps(pkgName, workspacePackages, visited = new Set()) {
	if (visited.has(pkgName)) return [];
	visited.add(pkgName);

	const pkgDir = workspacePackages.get(pkgName);
	if (!pkgDir) throw new Error(`Workspace package not found: ${pkgName}`);

	const pkgJson = JSON.parse(await fs.readFile(path.join(pkgDir, 'package.json'), 'utf-8'));
	const deps = Object.keys({ ...pkgJson.dependencies, ...pkgJson.optionalDependencies });
	const results = [];

	for (const dep of deps) {
		if (isWorkspacePackage(dep)) {
			results.push(...(await collectExternalDeps(dep, workspacePackages, visited)));
		} else {
			results.push({ pkg: dep, fromDir: pkgDir });
		}
	}

	return results;
}

async function collectWorkspacePackages(repoRoot) {
	const packageMap = new Map();

	for (const root of [path.join(repoRoot, 'apps'), path.join(repoRoot, 'packages')]) {
		const files = await findPackageJsonFiles(root);
		for (const file of files) {
			const { name } = JSON.parse(await fs.readFile(file, 'utf-8'));
			if (typeof name === 'string') packageMap.set(name, path.dirname(file));
		}
	}

	return packageMap;
}

async function findPackageJsonFiles(rootDir) {
	const entries = await fs.readdir(rootDir, { withFileTypes: true });
	const results = [];

	for (const entry of entries) {
		const entryPath = path.join(rootDir, entry.name);
		if (entry.isDirectory() && !skipDir(entry.name)) {
			results.push(...(await findPackageJsonFiles(entryPath)));
		} else if (entry.isFile() && entry.name === 'package.json') {
			results.push(entryPath);
		}
	}

	return results;
}

function skipDir(name) {
	return ['node_modules', 'dist', 'deploy', 'coverage', '.turbo'].includes(name);
}

function isWorkspacePackage(name) {
	return name.startsWith(APPLICATION_NAMESPACE) || name.startsWith('@cellix/');
}
