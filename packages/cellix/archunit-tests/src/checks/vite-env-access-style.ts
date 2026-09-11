import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const DEFAULT_SKIP_DIRS = new Set(['node_modules', '.turbo', 'build-artifacts', 'dist', 'build', 'coverage', '.git', 'storybook-static', '.next', '.test-work']);

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs']);

export interface ViteEnvAccessStyleConfig {
	/**
	 * Files or directories to scan. Relative paths resolve from `process.cwd()`.
	 * Missing paths are skipped.
	 */
	scanPaths: string[];
	/**
	 * Directory names to skip while walking. Defaults include `node_modules`, `dist`, `coverage`, and similar build output.
	 */
	skipDirs?: string[];
}

/**
 * Scans UI source for `import.meta.env` access that bypasses `noPropertyAccessFromIndexSignature`.
 *
 * Vite's `ImportMetaEnv` keeps an index signature, so destructuring and bracket access type-check for undeclared names
 * and ship as `undefined`. Property access (`import.meta.env.VITE_…`) is the form that fails the compile for typos.
 *
 * @param config - Scan roots and optional directory exclusions
 * @returns Human-readable violation messages of the form `[relative/path:line] …`
 *
 * @example
 * ```ts
 * const violations = await checkViteEnvAccessStyle({ scanPaths: ['./src'] });
 * // [] when every import.meta.env use is property access
 * ```
 */
export async function checkViteEnvAccessStyle(config: ViteEnvAccessStyleConfig): Promise<string[]> {
	if (!config.scanPaths || config.scanPaths.length === 0) {
		throw new Error('checkViteEnvAccessStyle requires scanPaths to be set');
	}

	const skipDirs = new Set(config.skipDirs ?? DEFAULT_SKIP_DIRS);
	const filesToScan = collectSourceFiles(config.scanPaths, skipDirs);
	const violations: string[] = [];

	for (const filePath of filesToScan) {
		const content = await fs.promises.readFile(filePath, 'utf8');
		violations.push(...findAccessStyleViolations(filePath, content));
	}

	return violations;
}

function collectSourceFiles(scanPaths: string[], skipDirs: Set<string>): string[] {
	const files = new Set<string>();

	for (const scanPath of scanPaths) {
		const resolved = path.resolve(process.cwd(), scanPath);
		if (!fs.existsSync(resolved)) {
			continue;
		}

		const stat = fs.statSync(resolved);
		if (stat.isFile()) {
			if (isSourceFile(resolved)) {
				files.add(resolved);
			}
			continue;
		}

		walkDir(resolved, skipDirs, files);
	}

	return Array.from(files).sort();
}

function walkDir(dir: string, skipDirs: Set<string>, files: Set<string>): void {
	const entries = fs.readdirSync(dir, { withFileTypes: true });
	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			if (skipDirs.has(entry.name) || entry.name.startsWith('.')) {
				continue;
			}
			walkDir(fullPath, skipDirs, files);
			continue;
		}

		if (isSourceFile(fullPath)) {
			files.add(fullPath);
		}
	}
}

function isSourceFile(filePath: string): boolean {
	if (filePath.endsWith('.d.ts') || filePath.endsWith('.d.mts') || filePath.endsWith('.d.cts')) {
		return false;
	}
	return SOURCE_EXTENSIONS.has(path.extname(filePath));
}

function findAccessStyleViolations(filePath: string, content: string): string[] {
	const scriptKind = scriptKindForPath(filePath);
	const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true, scriptKind);
	const violations: string[] = [];
	const displayPath = formatDisplayPath(filePath);

	const visit = (node: ts.Node): void => {
		if (isDestructuringOfImportMetaEnv(node)) {
			violations.push(`[${displayPath}:${lineOf(sourceFile, node)}] Do not destructure import.meta.env; use property access (import.meta.env.VITE_…) so undeclared names fail under noPropertyAccessFromIndexSignature`);
		}

		if (ts.isElementAccessExpression(node) && isImportMetaEnv(node.expression)) {
			violations.push(`[${displayPath}:${lineOf(sourceFile, node)}] Do not use index access on import.meta.env; use property access (import.meta.env.VITE_…) so undeclared names fail under noPropertyAccessFromIndexSignature`);
		}

		ts.forEachChild(node, visit);
	};

	visit(sourceFile);
	return violations;
}

function isDestructuringOfImportMetaEnv(node: ts.Node): boolean {
	if (ts.isVariableDeclaration(node) && node.initializer && isImportMetaEnv(node.initializer) && isBindingPattern(node.name)) {
		return true;
	}

	if (ts.isParameter(node) && node.initializer && isImportMetaEnv(node.initializer) && isBindingPattern(node.name)) {
		return true;
	}

	if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken && isImportMetaEnv(node.right) && isAssignmentDestructuringTarget(node.left)) {
		return true;
	}

	return false;
}

function isBindingPattern(node: ts.Node): node is ts.ObjectBindingPattern | ts.ArrayBindingPattern {
	return ts.isObjectBindingPattern(node) || ts.isArrayBindingPattern(node);
}

function isAssignmentDestructuringTarget(node: ts.Node): boolean {
	return ts.isObjectLiteralExpression(node) || ts.isArrayLiteralExpression(node);
}

function isImportMetaEnv(node: ts.Node): boolean {
	return ts.isPropertyAccessExpression(node) && node.name.text === 'env' && ts.isMetaProperty(node.expression) && node.expression.keywordToken === ts.SyntaxKind.ImportKeyword && node.expression.name.text === 'meta';
}

function scriptKindForPath(filePath: string): ts.ScriptKind {
	switch (path.extname(filePath)) {
		case '.tsx':
			return ts.ScriptKind.TSX;
		case '.jsx':
			return ts.ScriptKind.JSX;
		case '.js':
		case '.mjs':
		case '.cjs':
			return ts.ScriptKind.JS;
		default:
			return ts.ScriptKind.TS;
	}
}

function lineOf(sourceFile: ts.SourceFile, node: ts.Node): number {
	return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
}

function formatDisplayPath(filePath: string): string {
	const relativePath = path.relative(process.cwd(), filePath);
	const displayPath = relativePath.length > 0 && !relativePath.startsWith('..') ? relativePath : filePath;
	return displayPath.split(path.sep).join('/');
}
