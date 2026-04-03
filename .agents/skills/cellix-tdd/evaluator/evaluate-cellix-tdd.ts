import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import process from "node:process";
import { parseEvaluateArgs, printEvaluateUsage } from "./cli-utils.ts";
import { parseMarkdownSections, isTemplateBoilerplate, hasHeading, escapeRegExp } from "./markdown-utils.ts";
import { directoryExists, fileExists, getDefaultSummaryPath } from "./utils.ts";

const requiredOutputSections = [
	"package framing",
	"consumer usage exploration",
	"contract gate summary",
	"public contract",
	"test plan",
	"changes made",
	"documentation updates",
	"release hardening notes",
	"validation performed",
] as const;

const requiredManifestSections = [
	"Purpose",
	"Scope",
	"Non-goals",
	"Public API shape",
	"Core concepts",
	"Package boundaries",
	"Dependencies / relationships",
	"Testing strategy",
	"Documentation obligations",
	"Release-readiness standards",
] as const;

const checkDefinitions = [
	{
		id: "required_workflow_sections",
		weight: 3,
		critical: true,
		description: "Required workflow sections are present with meaningful content.",
	},
	{
		id: "public_contract_only_tests",
		weight: 4,
		critical: true,
		description: "Tests exercise the package through public entrypoints only, with export-focused suites and no obvious duplicate lower-level coverage.",
	},
	{
		id: "documentation_alignment",
		weight: 4,
		critical: true,
		description: "manifest.md, README.md, and the public contract stay aligned.",
	},
	{
		id: "public_export_tsdoc",
		weight: 3,
		critical: true,
		description: "Meaningful public exports have TSDoc.",
	},
	{
		id: "contract_surface",
		weight: 2,
		critical: true,
		description: "The package does not expose obvious internal helper exports.",
	},
	{
		id: "release_hardening_notes",
		weight: 2,
		critical: true,
		description: "Release hardening notes cover compatibility, export review, and remaining risk.",
	},
	{
		id: "validation_summary",
		weight: 2,
		critical: true,
		description: "Validation performed is summarized with concrete build and test evidence.",
	},
] as const;

const maxScore = checkDefinitions.reduce((total, check) => total + check.weight, 0);
const passingScore = 16;

type CheckId = (typeof checkDefinitions)[number]["id"];

interface ExportDeclaration {
	filePath: string;
	docText: string;
	name: string;
	hasDoc: boolean;
	kind: string;
}

interface CheckResult {
	id: CheckId;
	weight: number;
	critical: boolean;
	description: string;
	passed: boolean;
	details: string[];
}

interface EvaluationResult {
	label: string;
	packageRoot: string;
	outputPath: string;
	totalScore: number;
	overallStatus: "pass" | "fail";
	failedChecks: CheckId[];
	checks: CheckResult[];
}

interface ExpectedReport {
	overallStatus: "pass" | "fail";
	failedChecks: CheckId[];
}

interface ParsedArgs {
	fixtureDir?: string;
	fixturesRoot?: string;
	packageRoot?: string;
	outputPath?: string;
	verifyExpected: boolean;
	json: boolean;
}

function parseArgs(argv: string[]): ParsedArgs {
	return parseEvaluateArgs(argv);
}

function printUsage(): void {
	printEvaluateUsage();
}

function readText(filePath: string): string {
	return readFileSync(filePath, "utf8");
}

function readJson<T>(filePath: string): T {
	return JSON.parse(readText(filePath)) as T;
}

function listFiles(root: string): string[] {
	const files: string[] = [];

	for (const entry of readdirSync(root, { withFileTypes: true })) {
		if (entry.name === "node_modules" || entry.name === "coverage" || entry.name === "dist") {
			continue;
		}

		const fullPath = join(root, entry.name);

		if (entry.isDirectory()) {
			files.push(...listFiles(fullPath));
			continue;
		}

		files.push(fullPath);
	}

	return files;
}

function findDocFile(packageRoot: string, names: string[]): string | null {
	for (const name of names) {
		const candidate = join(packageRoot, name);
		if (fileExists(candidate)) {
			return candidate;
		}
	}

	return null;
}

function resolvePackageJson(packageRoot: string): Record<string, unknown> {
	const packageJsonPath = join(packageRoot, "package.json");
	if (!fileExists(packageJsonPath)) {
		return {};
	}

	return readJson<Record<string, unknown>>(packageJsonPath);
}

function collectExportTargets(
	value: unknown,
	exportKey: string,
	results: Map<string, string[]>,
): void {
	if (typeof value === "string") {
		const existing = results.get(exportKey) ?? [];
		existing.push(value);
		results.set(exportKey, existing);
		return;
	}

	if (Array.isArray(value)) {
		for (const item of value) {
			collectExportTargets(item, exportKey, results);
		}
		return;
	}

	if (!value || typeof value !== "object") {
		return;
	}

	const entries = Object.entries(value as Record<string, unknown>);
	const hasSubpathKeys = entries.some(([key]) => key === "." || key.startsWith("./"));

	if (hasSubpathKeys) {
		for (const [key, child] of entries) {
			collectExportTargets(child, key, results);
		}
		return;
	}

	for (const [, child] of entries) {
		collectExportTargets(child, exportKey, results);
	}
}

function resolveExports(
	packageRoot: string,
	packageJson: Record<string, unknown>,
): Map<string, string[]> {
	const exportsMap = new Map<string, string[]>();
	const packageExports = packageJson.exports;

	if (packageExports !== undefined) {
		collectExportTargets(packageExports, ".", exportsMap);
	}

	if (exportsMap.size > 0) {
		return exportsMap;
	}

	const fallbackTargets = ["./src/index.ts", "./index.ts", "./src/index.js", "./index.js"];
	for (const target of fallbackTargets) {
		const resolved = resolvePackageFile(packageRoot, target);
		if (resolved) {
			exportsMap.set(".", [target]);
			break;
		}
	}

	return exportsMap;
}

function resolvePackageFile(packageRoot: string, target: string): string | null {
	const basePath = resolve(packageRoot, target);
	const candidates = /\.[a-z]+$/i.exec(target)
		? [basePath]
		: [
			basePath,
			`${basePath}.ts`,
			`${basePath}.tsx`,
			`${basePath}.js`,
			`${basePath}.jsx`,
			join(basePath, "index.ts"),
			join(basePath, "index.tsx"),
			join(basePath, "index.js"),
			join(basePath, "index.jsx"),
		];

	for (const candidate of candidates) {
		if (fileExists(candidate)) {
			return candidate;
		}
	}

	return null;
}

function isInside(childPath: string, parentPath: string): boolean {
	const relation = relative(parentPath, childPath);
	return relation !== ".." && !relation.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`);
}

function collectAllowedEntryFiles(
	packageRoot: string,
	exportTargets: Map<string, string[]>,
): Set<string> {
	const allowed = new Set<string>();

	for (const targets of exportTargets.values()) {
		for (const target of targets) {
			const resolved = resolvePackageFile(packageRoot, target);
			if (resolved) {
				allowed.add(resolved);
			}
		}
	}

	return allowed;
}

function extractImportSpecifiers(source: string): string[] {
	const specifiers = new Set<string>();
	const staticImportPattern = /\b(?:import|export)\b[\s\S]*?\bfrom\s+["']([^"']+)["']/g;
	const dynamicImportPattern = /\bimport\(\s*["']([^"']+)["']\s*\)/g;

	for (const match of source.matchAll(staticImportPattern)) {
		specifiers.add(match[1]);
	}

	for (const match of source.matchAll(dynamicImportPattern)) {
		specifiers.add(match[1]);
	}

	return [...specifiers];
}

function findExportDeclarations(
	filePath: string,
	packageRoot: string,
	visited: Set<string> = new Set(),
): ExportDeclaration[] {
	if (visited.has(filePath)) {
		return [];
	}

	visited.add(filePath);

	const source = readText(filePath);
	const declarations: ExportDeclaration[] = [];

	// Direct named export declarations: export function/const/class/interface/type Name
	const directPattern =
		/(\/\*\*[\s\S]*?\*\/\s*)?export\s+(?:declare\s+)?(?:async\s+)?(function|const|class|interface|type)\s+(\w+)/g;
	for (const match of source.matchAll(directPattern)) {
		declarations.push({
			filePath,
			docText: match[1]?.trim() ?? "",
			hasDoc: Boolean(match[1]?.trim()),
			kind: match[2] ?? "unknown",
			name: match[3] ?? "unknown",
		});
	}

	// export default function / export default class
	const defaultPattern =
		/(\/\*\*[\s\S]*?\*\/\s*)?export\s+default\s+(?:async\s+)?(function|class)\s*(\w*)/g;
	for (const match of source.matchAll(defaultPattern)) {
		declarations.push({
			filePath,
			docText: match[1]?.trim() ?? "",
			hasDoc: Boolean(match[1]?.trim()),
			kind: match[2] ?? "unknown",
			name: match[3] || "default",
		});
	}

	// Named re-exports: export { Name [as Alias], ... } from './source'
	const namedReExportPattern = /export\s*\{([^}]+)\}\s*from\s*["']([^"']+)["']/g;
	for (const match of source.matchAll(namedReExportPattern)) {
		const namesStr = match[1];
		const specifier = match[2];

		if (!namesStr || !specifier?.startsWith(".")) {
			continue;
		}

		const resolvedSource = resolvePackageFile(dirname(filePath), specifier);
		if (!resolvedSource || !isInside(resolvedSource, packageRoot)) {
			continue;
		}

		const names = namesStr
			.split(",")
			.map((n) => {
				const parts = n.trim().split(/\s+as\s+/);
				return {
					exportedName: (parts[1] ?? parts[0] ?? "").trim(),
					originalName: (parts[0] ?? "").trim(),
				};
			})
			.filter((n) => n.originalName !== "");

		// A /** ... */ block immediately preceding this re-export line counts as TSDoc
		const prelude = source.slice(0, match.index ?? 0);
		const reExportDocText = /\/\*\*[\s\S]*?\*\/\s*$/.exec(prelude)?.[0]?.trim() ?? "";
		const reExportHasDoc = reExportDocText.length > 0;
		const sourceDeclarations = findExportDeclarations(resolvedSource, packageRoot, visited);

		for (const { originalName, exportedName } of names) {
			const sourceDecl = sourceDeclarations.find((d) => d.name === originalName);
			declarations.push(
				sourceDecl
					? {
						...sourceDecl,
						name: exportedName,
						hasDoc: sourceDecl.hasDoc || reExportHasDoc,
						docText: reExportDocText || sourceDecl.docText,
					}
					: {
						docText: reExportDocText,
						filePath: resolvedSource,
						hasDoc: reExportHasDoc,
						kind: "unknown",
						name: exportedName,
					},
			);
		}
	}

	// Star re-exports: export * from './source' and export * as ns from './source'
	const starReExportPattern = /export\s*\*\s*(?:as\s+\w+\s+)?from\s*["']([^"']+)["']/g;
	for (const match of source.matchAll(starReExportPattern)) {
		const specifier = match[1];

		if (!specifier?.startsWith(".")) {
			continue;
		}

		const resolvedSource = resolvePackageFile(dirname(filePath), specifier);
		if (!resolvedSource || !isInside(resolvedSource, packageRoot)) {
			continue;
		}

		declarations.push(...findExportDeclarations(resolvedSource, packageRoot, visited));
	}

	return declarations;
}

function getPublicDeclarations(
	allowedEntryFiles: Set<string>,
	packageRoot: string,
): ExportDeclaration[] {
	const seen = new Set<string>();
	const declarations: ExportDeclaration[] = [];

	for (const filePath of allowedEntryFiles) {
		for (const declaration of findExportDeclarations(filePath, packageRoot, new Set())) {
			const key = `${declaration.filePath}:${declaration.name}`;
			if (!seen.has(key)) {
				seen.add(key);
				declarations.push(declaration);
			}
		}
	}

	return declarations;
}

function stripTsdocDelimiters(docText: string): string {
	return docText
		.replace(/^\/\*\*\s*/, "")
		.replace(/\s*\*\/$/, "")
		.replaceAll(/^\s*\*\s?/gm, "")
		.trim();
}

function isFunctionLikeExport(kind: string): boolean {
	return kind === "function" || kind === "const" || kind === "class";
}

function hasNamedDescribeBlock(source: string, exportName: string): boolean {
	const patterns = [
		new RegExp(`\\bdescribe\\s*\\(\\s*["'\`]${escapeRegExp(exportName)}\\b`),
		new RegExp(`\\bdescribe\\s*\\(\\s*["'\`][^"'\`]*\\b${escapeRegExp(exportName)}\\b`),
	];

	return patterns.some((pattern) => pattern.test(source));
}

function exportAcceptsParameters(declaration: ExportDeclaration): boolean | null {
	const source = readText(declaration.filePath);

	if (declaration.kind === "function") {
		const match = new RegExp(
			String.raw`export\s+(?:declare\s+)?(?:async\s+)?function\s+${escapeRegExp(declaration.name)}\s*\(([^)]*)\)`,
		).exec(source);
		return match ? match[1].trim().length > 0 : null;
	}

	if (declaration.kind === "const") {
		const match = new RegExp(
			String.raw`export\s+const\s+${escapeRegExp(declaration.name)}(?:\s*:[^=]+)?\s*=\s*(?:async\s*)?\(([^)]*)\)\s*=>`,
		).exec(source);
		return match ? match[1].trim().length > 0 : null;
	}

	return null;
}

function getTsdocQualityIssues(declaration: ExportDeclaration): string[] {
	if (!declaration.hasDoc) {
		return [];
	}

	const issues: string[] = [];
	const cleanedDoc = stripTsdocDelimiters(declaration.docText);

	if (cleanedDoc.length < 24) {
		issues.push("TSDoc is too thin to be useful.");
	}

	if (!isFunctionLikeExport(declaration.kind)) {
		return issues;
	}

	if (!/@example\b/i.test(declaration.docText)) {
		issues.push("TSDoc should include at least one @example.");
	}

	if (!/@returns?\b/i.test(declaration.docText)) {
		issues.push("TSDoc should describe the return contract with @returns.");
	}

	const acceptsParameters = exportAcceptsParameters(declaration);
	if (acceptsParameters === true && !/@param\b/i.test(declaration.docText)) {
		issues.push("TSDoc should describe function parameters with @param.");
	}

	return issues;
}

function evaluateRequiredWorkflowSections(outputText: string): CheckResult {
	const sections = parseMarkdownSections(outputText);
	const missing = requiredOutputSections.filter((heading) => {
		const content = sections.get(heading);
		return !content || content.length < 30 || isTemplateBoilerplate(content);
	});

	return createCheckResult("required_workflow_sections", missing.length === 0, missing.length === 0 ? [
		"All required sections are present.",
	] : [`Missing or thin sections: ${missing.join(", ")}.`]);
}

function evaluatePublicContractOnlyTests(
	packageRoot: string,
	packageJson: Record<string, unknown>,
	exportTargets: Map<string, string[]>,
	publicDeclarations: ExportDeclaration[],
): CheckResult {
	const packageName = typeof packageJson.name === "string" ? packageJson.name : null;
	const allowedEntryFiles = collectAllowedEntryFiles(packageRoot, exportTargets);
	const testFiles = listFiles(packageRoot).filter((filePath) =>
		/\.(test|spec)\.[cm]?[jt]sx?$/.test(filePath),
	);
	const violations: string[] = [];

	if (testFiles.length === 0) {
		return createCheckResult("public_contract_only_tests", false, [
			"No test files were found under the package root.",
		]);
	}

	const testSources = testFiles.map((testFile) => ({ path: testFile, source: readText(testFile) }));
	for (const testFile of testFiles) {
		const source = testSources.find((entry) => entry.path === testFile)?.source ?? "";
		for (const specifier of extractImportSpecifiers(source)) {
			if (specifier.startsWith(".")) {
				const resolved = resolvePackageFile(dirname(testFile), specifier);
				if (resolved && isInside(resolved, packageRoot) && !allowedEntryFiles.has(resolved)) {
					violations.push(
						`${relative(packageRoot, testFile)} imports non-public file ${relative(packageRoot, resolved)}.`,
					);
				}
				continue;
			}

			if (packageName && specifier === packageName) {
				continue;
			}

			if (packageName && specifier.startsWith(`${packageName}/`)) {
				const subpath = `./${specifier.slice(packageName.length + 1)}`;
				if (!exportTargets.has(subpath)) {
					violations.push(
						`${relative(packageRoot, testFile)} imports undeclared package subpath ${specifier}.`,
					);
					continue;
				}

				if (isSuspiciousPublicPath(subpath)) {
					violations.push(
						`${relative(packageRoot, testFile)} imports suspicious public subpath ${specifier}.`,
					);
				}
			}
		}
	}

	const namedPublicExports = [...new Set(
		publicDeclarations
			.filter((declaration) => declaration.name !== "default" && isFunctionLikeExport(declaration.kind))
			.map((declaration) => declaration.name),
	)];

	for (const exportName of namedPublicExports) {
		const hasExportNamedSuite = testSources.some(({ source }) => hasNamedDescribeBlock(source, exportName));
		if (!hasExportNamedSuite) {
			violations.push(`Tests do not identify public export ${exportName} in a describe block.`);
		}
	}

	return createCheckResult("public_contract_only_tests", violations.length === 0, violations.length === 0 ? [
		`Found ${testFiles.length} contract-focused test file(s) using public entrypoints and named export suites.`,
	] : violations);
}

function evaluateDocumentationAlignment(
	packageRoot: string,
	publicDeclarations: ExportDeclaration[],
): CheckResult {
	const manifestPath = findDocFile(packageRoot, ["manifest.md"]);
	const readmePath = findDocFile(packageRoot, ["README.md", "readme.md"]);

	if (!manifestPath || !readmePath) {
		return createCheckResult("documentation_alignment", false, [
			`${!manifestPath ? "manifest.md is missing." : ""}${!manifestPath && !readmePath ? " " : ""}${!readmePath ? "README.md is missing." : ""}`.trim(),
		]);
	}

	const manifestText = readText(manifestPath);
	const readmeText = readText(readmePath);
	const readmeSections = parseMarkdownSections(readmeText);
	const installSection = readmeSections.get("install") ?? readmeSections.get("installation") ?? "";
	const missingManifestSections = requiredManifestSections.filter(
		(section) => !hasHeading(manifestText, section),
	);
	const exportNames = [...new Set(publicDeclarations.map((declaration) => declaration.name))];
	const docsReferencePublicContract = exportNames.some((name) => {
		const pattern = new RegExp(`\\b${escapeRegExp(name)}\\b`);
		return pattern.test(manifestText) || pattern.test(readmeText);
	});
	const readmeConsumerFacing =
		/##\s+(usage|examples?|getting?\s+started|quick\s+start|installation|install|api(?:\s+reference)?|overview|how\s+to(?:\s+use)?|guide)/i.test(readmeText) &&
		!/(internal notes|maintainers only|for maintainers|contributors only)/i.test(readmeText);
	const details: string[] = [];

	if (missingManifestSections.length > 0) {
		details.push(`Missing manifest sections: ${missingManifestSections.join(", ")}.`);
	}

	if (!readmeConsumerFacing) {
		details.push("README.md is not clearly consumer-facing or lacks usage/example guidance.");
	}

	if (installSection.length > 0 && /\b(-w|--filter)\b/.test(installSection)) {
		details.push("README install guidance looks workspace-specific instead of standalone.");
	}

	if (/@apps\//.test(readmeText)) {
		details.push("README.md references repo-local app packages instead of staying package-centric.");
	}

	if (!docsReferencePublicContract) {
		details.push("The manifest or README does not clearly reference the evaluated public contract.");
	}

	return createCheckResult(
		"documentation_alignment",
		details.length === 0,
		details.length === 0
			? ["manifest.md and README.md align with the public contract."]
			: details,
	);
}

function evaluatePublicExportTsdoc(publicDeclarations: ExportDeclaration[]): CheckResult {
	if (publicDeclarations.length === 0) {
		return createCheckResult("public_export_tsdoc", false, [
			"No public export declarations were found in the evaluated entrypoints.",
		]);
	}

	const undocumented = publicDeclarations.filter((declaration) => !declaration.hasDoc);
	const lowQualityDocs = publicDeclarations
		.filter((declaration) => declaration.hasDoc)
		.flatMap((declaration) =>
			getTsdocQualityIssues(declaration).map((issue) => ({ declaration, issue })),
		);

	return createCheckResult(
		"public_export_tsdoc",
		undocumented.length === 0 && lowQualityDocs.length === 0,
		undocumented.length === 0 && lowQualityDocs.length === 0
			? [`Documented ${publicDeclarations.length} public export declaration(s) with TSDoc.`]
			: [
				...undocumented.map(
					(declaration) =>
						`${relative(process.cwd(), declaration.filePath)} exports ${declaration.kind} ${declaration.name} without TSDoc.`,
				),
				...lowQualityDocs.map(
					({ declaration, issue }) =>
						`${relative(process.cwd(), declaration.filePath)} exports ${declaration.kind} ${declaration.name}: ${issue}`,
				),
			],
	);
}

function evaluateContractSurface(exportTargets: Map<string, string[]>): CheckResult {
	const suspiciousTargets: string[] = [];

	for (const [key, targets] of exportTargets.entries()) {
		if (isSuspiciousPublicPath(key)) {
			suspiciousTargets.push(`Export key ${key} looks internal.`);
		}

		for (const target of targets) {
			if (isSuspiciousPublicPath(target)) {
				suspiciousTargets.push(`Export target ${target} looks internal.`);
			}
		}
	}

	return createCheckResult(
		"contract_surface",
		suspiciousTargets.length === 0,
		suspiciousTargets.length === 0
			? ["The declared export surface does not expose obvious internals."]
			: suspiciousTargets,
	);
}

function isSuspiciousPublicPath(value: string): boolean {
	return /(^|\/|\.)?(internal|private|helper|helpers|impl)(\/|\.|-|$)/i.test(value);
}

function evaluateReleaseHardening(outputText: string): CheckResult {
	const section = parseMarkdownSections(outputText).get("release hardening notes") ?? "";
	const mentionsCompatibility = /\b(semver|compatible|backward|breaking|major|minor|patch)\b/i.test(section);
	const mentionsSurface = /\b(export surface|public surface|public entrypoint|exports?|exported|exporting)\b/i.test(section);
	const mentionsRisk = /\b(risk|follow-up|follow up|blocker|publish|release-ready|ready)\b/i.test(section);
	const details: string[] = [];

	if (!mentionsCompatibility) {
		details.push("Release hardening notes do not mention compatibility or semver impact.");
	}

	if (!mentionsSurface) {
		details.push("Release hardening notes do not mention export or public surface review.");
	}

	if (!mentionsRisk) {
		details.push("Release hardening notes do not mention remaining risk, follow-up, or publish readiness.");
	}

	return createCheckResult(
		"release_hardening_notes",
		details.length === 0,
		details.length === 0 ? ["Release hardening notes cover compatibility, surface review, and remaining risk."] : details,
	);
}

function evaluateValidationSummary(outputText: string): CheckResult {
	const section = parseMarkdownSections(outputText).get("validation performed") ?? "";
	const mentionsWork = /\b(validated|verified|ran|re-ran|tested|confirmed)\b/i.test(section);
	const mentionsBuild = /\b(build|built|compiled|compile|tsc|rolldown|vite build|turbo run build)\b/i.test(section);
	const mentionsTests = /\b(test|tests|vitest|jest|turbo run test)\b/i.test(section);
	const mentionsOutcome = /\b(pass|passed|fail|failed|confirmed|verified|unverified|skipped|success|succeeds?|succeeded)\b/i.test(section);
	const details: string[] = [];

	if (!mentionsWork) {
		details.push("Validation performed does not describe the work that was run.");
	}

	if (!mentionsBuild) {
		details.push("Validation performed does not mention a package build or equivalent compile verification.");
	}

	if (!mentionsTests) {
		details.push("Validation performed does not mention the existing package tests or equivalent test verification.");
	}

	if (!mentionsOutcome) {
		details.push("Validation performed does not include concrete pass/fail or verified/unverified outcomes.");
	}

	return createCheckResult(
		"validation_summary",
		details.length === 0,
		details.length === 0 ? ["Validation performed includes concrete build and test verification evidence."] : details,
	);
}

function createCheckResult(id: CheckId, passed: boolean, details: string[]): CheckResult {
	const definition = checkDefinitions.find((check) => check.id === id);
	if (!definition) {
		throw new Error(`Unknown check id: ${id}`);
	}

	return {
		critical: definition.critical,
		description: definition.description,
		details,
		id,
		passed,
		weight: definition.weight,
	};
}

function evaluatePackage(
	label: string,
	packageRoot: string,
	outputPath: string,
): EvaluationResult {
	if (!fileExists(outputPath)) {
		throw new Error(`Output summary not found: ${outputPath}`);
	}

	const outputText = readText(outputPath);
	const packageJson = resolvePackageJson(packageRoot);
	const exportTargets = resolveExports(packageRoot, packageJson);
	const publicDeclarations = getPublicDeclarations(collectAllowedEntryFiles(packageRoot, exportTargets), packageRoot);
	const checks = [
		evaluateRequiredWorkflowSections(outputText),
		evaluatePublicContractOnlyTests(packageRoot, packageJson, exportTargets, publicDeclarations),
		evaluateDocumentationAlignment(packageRoot, publicDeclarations),
		evaluatePublicExportTsdoc(publicDeclarations),
		evaluateContractSurface(exportTargets),
		evaluateReleaseHardening(outputText),
		evaluateValidationSummary(outputText),
	];
	const totalScore = checks.reduce(
		(total, check) => total + (check.passed ? check.weight : 0),
		0,
	);
	const failedChecks = checks.filter((check) => !check.passed).map((check) => check.id);
	const hasCriticalFailure = checks.some((check) => check.critical && !check.passed);

	return {
		checks,
		failedChecks,
		label,
		outputPath,
		overallStatus: !hasCriticalFailure && totalScore >= passingScore ? "pass" : "fail",
		packageRoot,
		totalScore,
	};
}

function compareExpected(result: EvaluationResult, expected: ExpectedReport): { matches: boolean; problems: string[] } {
	const actualFailed = [...result.failedChecks].sort();
	const expectedFailed = [...expected.failedChecks].sort();
	const problems: string[] = [];

	if (result.overallStatus !== expected.overallStatus) {
		problems.push(`Expected overall status ${expected.overallStatus} but got ${result.overallStatus}.`);
	}

	if (JSON.stringify(actualFailed) !== JSON.stringify(expectedFailed)) {
		problems.push(
			`Expected failed checks [${expectedFailed.join(", ")}] but got [${actualFailed.join(", ")}].`,
		);
	}

	return {
		matches: problems.length === 0,
		problems,
	};
}

function formatResult(result: EvaluationResult): string {
	const lines = [
		`${result.label}: ${result.overallStatus.toUpperCase()} (${result.totalScore}/${maxScore})`,
	];

	for (const check of result.checks) {
		lines.push(
			`- [${check.passed ? "pass" : "fail"}] ${check.id} (${check.passed ? check.weight : 0}/${check.weight})`,
		);
		for (const detail of check.details) {
			lines.push(`  ${detail}`);
		}
	}

	return lines.join("\n");
}

function evaluateFixture(fixtureDir: string, verifyExpected: boolean): {
	result: EvaluationResult;
	comparison?: { matches: boolean; problems: string[] };
} {
	const packageRoot = join(fixtureDir, "package");
	const outputPath = join(fixtureDir, "agent-output.md");
	const result = evaluatePackage(relative(process.cwd(), fixtureDir), packageRoot, outputPath);

	if (!verifyExpected) {
		return { result };
	}

	const expectedPath = join(fixtureDir, "expected-report.json");
	if (!fileExists(expectedPath)) {
		throw new Error(`Expected report not found: ${expectedPath}`);
	}

	return {
		comparison: compareExpected(result, readJson<ExpectedReport>(expectedPath)),
		result,
	};
}

function getFixtureDirectories(fixturesRoot: string): string[] {
	return readdirSync(fixturesRoot)
		.map((entry) => join(fixturesRoot, entry))
		.filter((entryPath) => directoryExists(entryPath))
		.sort();
}

function main(): void {
	const args = parseArgs(process.argv.slice(2));

	if (args.fixturesRoot) {
		const fixtureDirs = getFixtureDirectories(resolve(args.fixturesRoot));
		const results = fixtureDirs.map((fixtureDir) => evaluateFixture(fixtureDir, args.verifyExpected));
		const mismatches = results.filter((entry) => entry.comparison && !entry.comparison.matches);

		if (args.json) {
			console.log(
				JSON.stringify(
					results.map((entry) => ({
						comparison: entry.comparison ?? null,
						result: entry.result,
					})),
					null,
					2,
				),
			);
		} else {
			for (const entry of results) {
				console.log(formatResult(entry.result));
				if (entry.comparison) {
					console.log(
						entry.comparison.matches
							? "  Expected report matched."
							: `  Expected report mismatch: ${entry.comparison.problems.join(" ")}`,
					);
				}
			}
		}

		process.exit(mismatches.length === 0 ? 0 : 1);
	}

	if (args.fixtureDir) {
		const evaluation = evaluateFixture(resolve(args.fixtureDir), args.verifyExpected);

		if (args.json) {
			console.log(JSON.stringify(evaluation, null, 2));
		} else {
			console.log(formatResult(evaluation.result));
			if (evaluation.comparison) {
				console.log(
					evaluation.comparison.matches
						? "Expected report matched."
						: `Expected report mismatch: ${evaluation.comparison.problems.join(" ")}`,
				);
			}
		}

		process.exit(
			evaluation.comparison
				? evaluation.comparison.matches
					? 0
					: 1
				: evaluation.result.overallStatus === "pass"
					? 0
					: 1,
		);
	}

	if (args.packageRoot && args.outputPath) {
		const resolvedPackageRoot = resolve(args.packageRoot);
		const outputPath = resolve(args.outputPath);
		const result = evaluatePackage(
			relative(process.cwd(), resolvedPackageRoot),
			resolvedPackageRoot,
			outputPath,
		);

		if (args.json) {
			console.log(JSON.stringify(result, null, 2));
		} else {
			console.log(formatResult(result));
		}

		process.exit(result.overallStatus === "pass" ? 0 : 1);
	}

	if (args.packageRoot) {
		const resolvedPackageRoot = resolve(args.packageRoot);
		const outputPath = getDefaultSummaryPath(resolvedPackageRoot);

		if (!fileExists(outputPath)) {
			throw new Error(
				`Summary not found at default path: ${outputPath}\nRun pnpm run skill:cellix-tdd:check -- --package ${relative(process.cwd(), resolvedPackageRoot)} first, or pass --output explicitly.`,
			);
		}

		const result = evaluatePackage(
			relative(process.cwd(), resolvedPackageRoot),
			resolvedPackageRoot,
			outputPath,
		);

		if (args.json) {
			console.log(JSON.stringify(result, null, 2));
		} else {
			console.log(formatResult(result));
		}

		process.exit(result.overallStatus === "pass" ? 0 : 1);
	}

	printUsage();
	process.exit(1);
}

main();
