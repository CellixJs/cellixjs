import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createRequire, isBuiltin } from 'node:module';
import { fileURLToPath } from 'node:url';
import { build } from 'rolldown';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const apiDir = path.resolve(__dirname, '..');
const repoRoot = path.resolve(apiDir, '../..');
const distEntryFile = path.join(apiDir, 'dist/src/index.js');
const deployDir = path.join(apiDir, 'deploy');
const deployDistDir = path.join(deployDir, 'dist');
const packageJsonPath = path.join(apiDir, 'package.json');
const hostJsonPath = path.join(apiDir, 'host.json');
const banner = `import { createRequire as __createRequire } from 'node:module';
globalThis.require = __createRequire(import.meta.url);`;
const require = createRequire(import.meta.url);
const workspacePackageMap = await collectWorkspacePackages();
const bundlerAliasMap = await buildBundlerAliasMap();

await ensureCompiledEntryExists();
await fs.rm(deployDir, { recursive: true, force: true });
await fs.mkdir(deployDistDir, { recursive: true });

await build({
	cwd: apiDir,
	input: distEntryFile,
	logLevel: 'warn',
	onLog(level, log, defaultHandler) {
		if (level === 'warn'
			&& log.code === 'EVAL'
			&& typeof log.message === 'string'
			&& log.message.includes('@protobufjs/inquire/index.js')) {
			return;
		}

		defaultHandler(level, log);
	},
	platform: 'node',
	resolve: {
		alias: bundlerAliasMap,
	},
	treeshake: true,
	external: shouldExternalizeModule,
	output: {
		dir: deployDistDir,
		format: 'esm',
		sourcemap: true,
		banner: banner,
	},
});

await Promise.all([
	fs.copyFile(hostJsonPath, path.join(deployDir, 'host.json')),
	writeDeployPackageJson(),
]);

async function ensureCompiledEntryExists() {
	await fs.access(distEntryFile).catch(() => {
		throw new Error(`Expected compiled entrypoint at ${distEntryFile}. Run the TypeScript build before packaging.`);
	});
}

function shouldExternalizeModule(id) {
	return isBuiltin(id) || id.startsWith('node:');
}

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

async function buildBundlerAliasMap() {
	const externalPackages = await collectExternalDependencies('@ocom/api');
	const aliasMap = {};

	for (const packageName of externalPackages) {
		aliasMap[packageName] = await resolvePreferredBundleEntry(packageName);
	}

	return aliasMap;
}

async function resolvePreferredBundleEntry(packageName) {
	const packageRoot = await resolveInstalledPackageRoot(packageName);
	const installedPackageJson = JSON.parse(
		await fs.readFile(path.join(packageRoot, 'package.json'), 'utf8'),
	);

	const exportsEntry = installedPackageJson.exports?.['.'];
	const exportTarget = resolveExportTarget(exportsEntry?.require)
		?? resolveExportTarget(exportsEntry?.default)
		?? resolveExportTarget(exportsEntry?.import);
	if (exportTarget) {
		return resolvePackageFile(packageRoot, exportTarget);
	}

	if (typeof installedPackageJson.main === 'string' && installedPackageJson.main.length > 0) {
		return resolvePackageFile(packageRoot, installedPackageJson.main);
	}

	for (const candidatePath of ['dist/index.js', 'cjs/index.js', 'index.js']) {
		const absoluteCandidatePath = path.join(packageRoot, candidatePath);
		const exists = await fs.access(absoluteCandidatePath).then(() => true).catch(() => false);
		if (exists) {
			return absoluteCandidatePath;
		}
	}

	return require.resolve(packageName, { paths: [apiDir, repoRoot, packageRoot] });
}

async function collectExternalDependencies(packageName, visitedWorkspacePackages = new Set()) {
	if (visitedWorkspacePackages.has(packageName)) {
		return [];
	}

	const packageDir = workspacePackageMap.get(packageName);
	if (!packageDir) {
		throw new Error(`Unable to locate workspace package ${packageName}`);
	}

	visitedWorkspacePackages.add(packageName);

	const packageJson = JSON.parse(
		await fs.readFile(path.join(packageDir, 'package.json'), 'utf8'),
	);
	const dependencyNames = Object.keys({
		...(packageJson.dependencies ?? {}),
		...(packageJson.optionalDependencies ?? {}),
	}).sort((a, b) => a.localeCompare(b));
	const externalDependencies = new Set();

	for (const dependencyName of dependencyNames) {
		if (isWorkspacePackage(dependencyName)) {
			const nestedExternalDependencies = await collectExternalDependencies(
				dependencyName,
				visitedWorkspacePackages,
			);
			for (const nestedExternalDependency of nestedExternalDependencies) {
				externalDependencies.add(nestedExternalDependency);
			}
			continue;
		}

		externalDependencies.add(dependencyName);
	}

	return [...externalDependencies].sort((a, b) => a.localeCompare(b));
}

async function collectWorkspacePackages() {
	const workspaceRoots = [
		path.join(repoRoot, 'apps'),
		path.join(repoRoot, 'packages'),
	];
	const packageMap = new Map();

	for (const workspaceRoot of workspaceRoots) {
		const packageJsonFiles = await findPackageJsonFiles(workspaceRoot);
		for (const workspacePackageJsonPath of packageJsonFiles) {
			const workspacePackageJson = JSON.parse(await fs.readFile(workspacePackageJsonPath, 'utf8'));
			if (typeof workspacePackageJson.name === 'string') {
				packageMap.set(workspacePackageJson.name, path.dirname(workspacePackageJsonPath));
			}
		}
	}

	return packageMap;
}

async function findPackageJsonFiles(rootDir) {
	const entries = await fs.readdir(rootDir, { withFileTypes: true });
	const packageJsonFiles = [];

	for (const entry of entries) {
		const entryPath = path.join(rootDir, entry.name);
		if (entry.isDirectory()) {
			if (shouldSkipWorkspaceScan(entry.name)) {
				continue;
			}
			packageJsonFiles.push(...await findPackageJsonFiles(entryPath));
			continue;
		}

		if (entry.isFile() && entry.name === 'package.json') {
			packageJsonFiles.push(entryPath);
		}
	}

	return packageJsonFiles;
}

function shouldSkipWorkspaceScan(name) {
	return [
		'node_modules',
		'dist',
		'deploy',
		'coverage',
		'.turbo',
	].includes(name);
}

function isWorkspacePackage(packageName) {
	return packageName.startsWith('@ocom/') || packageName.startsWith('@cellix/');
}

function getPackageName(specifier) {
	if (specifier.startsWith('@')) {
		const [scope, name] = specifier.split('/');
		return `${scope}/${name}`;
	}

	return specifier.split('/')[0];
}

function resolveExportTarget(value) {
	if (typeof value === 'string') {
		return value;
	}

	if (value && typeof value === 'object' && typeof value.default === 'string') {
		return value.default;
	}

	return undefined;
}

async function resolveInstalledPackageRoot(packageName) {
	try {
		const installedPackageJsonPath = require.resolve(`${packageName}/package.json`, {
			paths: [apiDir, repoRoot],
		});
		return path.dirname(installedPackageJsonPath);
	} catch {
		const pnpmStoreDir = path.join(repoRoot, 'node_modules/.pnpm');
		const pnpmEntries = await fs.readdir(pnpmStoreDir);
		const packagePathSegments = packageName.split('/');

		for (const pnpmEntry of pnpmEntries.sort((a, b) => a.localeCompare(b))) {
			const candidatePackageJsonPath = path.join(
				pnpmStoreDir,
				pnpmEntry,
				'node_modules',
				...packagePathSegments,
				'package.json',
			);
			const exists = await fs.access(candidatePackageJsonPath).then(() => true).catch(() => false);
			if (!exists) {
				continue;
			}

			const candidatePackageJson = JSON.parse(await fs.readFile(candidatePackageJsonPath, 'utf8'));
			if (candidatePackageJson.name === packageName) {
				return path.dirname(candidatePackageJsonPath);
			}
		}

		throw new Error(`Unable to resolve installed package root for ${packageName}`);
	}
}

function resolvePackageFile(packageRoot, targetPath) {
	return require.resolve(path.resolve(packageRoot, targetPath));
}
