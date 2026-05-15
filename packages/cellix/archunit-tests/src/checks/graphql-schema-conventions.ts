import type { FileInfo } from 'archunit';
import { projectFiles } from 'archunit';

import { isKebabCase } from '../utils/frontend-helpers.js';

export interface GraphqlSchemaConventionsConfig {
	graphqlGlob: string;
	excludeFiles?: string[];
}

function stripComments(content: string): string {
	return content
		.replace(/#[^\n]*/g, '')
		.replace(/"""(?:[^"]|"(?!""))*"""/g, '')
		.replace(/"[^"]*"/g, '""');
}

function kebabToPascal(kebab: string): string {
	return kebab
		.split('-')
		.map((s) => s.charAt(0).toUpperCase() + s.slice(1))
		.join('');
}

interface ParsedDefinition {
	kind: 'type' | 'input' | 'enum' | 'union' | 'interface' | 'extend';
	extendedKind?: string;
	name: string;
	body: string;
	implements?: string;
	position: number;
}

function parseDefinitions(content: string): ParsedDefinition[] {
	const stripped = stripComments(content);
	const defs: ParsedDefinition[] = [];

	const defRegex = /\b(extend\s+)?(type|input|enum|union|interface)\s+(\w+)(?:\s+implements\s+(\w+))?\s*(?:[={])/g;
	let match = defRegex.exec(stripped);

	while (match !== null) {
		const isExtend = !!match[1];
		const kind = match[2] as ParsedDefinition['kind'];
		const name = match[3] as string;
		const implementsInterface = match[4];

		const startIdx = stripped.indexOf('{', match.index + match[0].length - 1);
		let body = '';
		if (startIdx !== -1) {
			let depth = 1;
			let i = startIdx + 1;
			while (i < stripped.length && depth > 0) {
				if (stripped[i] === '{') depth++;
				if (stripped[i] === '}') depth--;
				i++;
			}
			body = stripped.slice(startIdx + 1, i - 1);
		} else if (kind === 'union') {
			const lineEnd = stripped.indexOf('\n', match.index);
			body = stripped.slice(match.index, lineEnd === -1 ? undefined : lineEnd);
		}

		if (isExtend) {
			defs.push({ kind: 'extend', extendedKind: name, name, body, position: match.index });
		} else {
			defs.push({
				kind,
				name,
				body,
				position: match.index,
				...(implementsInterface && { implements: implementsInterface }),
			});
		}
		match = defRegex.exec(stripped);
	}

	return defs;
}

function parseMutationFields(body: string): Array<{ name: string; returnType: string }> {
	const fields: Array<{ name: string; returnType: string }> = [];
	let pos = 0;

	while (pos < body.length) {
		const nameRegex = /^\s*(\w+)\s*\(/;
		const nameMatch = nameRegex.exec(body.slice(pos));
		if (!nameMatch) break;

		const name = nameMatch[1] as string;
		pos += nameMatch[0].length - 1;

		let parenDepth = 1;
		let parenEnd = pos + 1;
		while (parenEnd < body.length && parenDepth > 0) {
			if (body[parenEnd] === '(') parenDepth++;
			if (body[parenEnd] === ')') parenDepth--;
			parenEnd++;
		}

		const afterParens = body.slice(parenEnd);
		const typeRegex = /^\s*:\s*([A-Za-z_]\w*(?:\[!?\])*!?)/;
		const typeMatch = typeRegex.exec(afterParens);
		if (!typeMatch) break;

		const returnType = typeMatch[1] as string;
		fields.push({ name, returnType });

		pos = parenEnd + typeMatch[0].length;
	}

	return fields;
}

export async function checkGraphqlSchemaFileNaming(config: GraphqlSchemaConventionsConfig): Promise<string[]> {
	if (!config.graphqlGlob) {
		throw new Error('checkGraphqlSchemaFileNaming requires graphqlGlob to be set');
	}

	const violations: string[] = [];
	const excluded = new Set(config.excludeFiles ?? []);

	await projectFiles()
		.inPath(config.graphqlGlob)
		.should()
		.adhereTo((file: FileInfo) => {
			const fileName = file.path.split('/').pop() ?? '';
			if (excluded.has(fileName)) return true;

			const stem = fileName.replace('.graphql', '');
			if (!isKebabCase(stem)) {
				violations.push(`[${fileName}] File name must use lower-kebab-case`);
				return false;
			}
			return true;
		}, 'GraphQL files must use lower-kebab-case naming')
		.check();

	return violations;
}

export async function checkGraphqlSchemaTypePrefixing(config: GraphqlSchemaConventionsConfig): Promise<string[]> {
	if (!config.graphqlGlob) {
		throw new Error('checkGraphqlSchemaTypePrefixing requires graphqlGlob to be set');
	}

	const violations: string[] = [];
	const excluded = new Set(config.excludeFiles ?? []);

	await projectFiles()
		.inPath(config.graphqlGlob)
		.should()
		.adhereTo((file: FileInfo) => {
			const fileName = file.path.split('/').pop() ?? '';
			if (excluded.has(fileName)) return true;

			const stem = fileName.replace('.graphql', '');
			const expectedPrefix = kebabToPascal(stem);
			const content = file.content;
			const defs = parseDefinitions(content);

			let hasViolation = false;
			for (const def of defs) {
				if (def.kind === 'extend') continue;
				if (def.kind === 'enum') continue;

				if (!def.name.startsWith(expectedPrefix)) {
					violations.push(`[${fileName}] ${def.kind} "${def.name}" must be prefixed with "${expectedPrefix}"`);
					hasViolation = true;
				}
			}
			return !hasViolation;
		}, 'GraphQL types must follow prefixing conventions')
		.check();

	return violations;
}

export async function checkGraphqlSchemaMutationResults(config: GraphqlSchemaConventionsConfig): Promise<string[]> {
	if (!config.graphqlGlob) {
		throw new Error('checkGraphqlSchemaMutationResults requires graphqlGlob to be set');
	}

	const violations: string[] = [];
	const excluded = new Set(config.excludeFiles ?? []);

	await projectFiles()
		.inPath(config.graphqlGlob)
		.should()
		.adhereTo((file: FileInfo) => {
			const fileName = file.path.split('/').pop() ?? '';
			if (excluded.has(fileName)) return true;

			const stem = fileName.replace('.graphql', '');
			const topLevelType = kebabToPascal(stem);
			const content = file.content;
			const defs = parseDefinitions(content);

			const mutationResults = defs.filter((d) => d.kind === 'type' && d.name.endsWith('MutationResult'));

			let hasViolation = false;
			for (const mr of mutationResults) {
				if (mr.implements !== 'MutationResult') {
					violations.push(`[${fileName}] type "${mr.name}" must implement MutationResult interface`);
					hasViolation = true;
				}

				if (!/status\s*:\s*MutationStatus!/.test(mr.body)) {
					violations.push(`[${fileName}] type "${mr.name}" must have field "status: MutationStatus!"`);
					hasViolation = true;
				}
			}

			const mutationExtends = defs.filter((d) => d.kind === 'extend' && d.extendedKind === 'Mutation');

			for (const ext of mutationExtends) {
				const fields = parseMutationFields(ext.body);

				for (const field of fields) {
					const returnType = field.returnType.replace('!', '').trim();
					if (!returnType.endsWith('MutationResult')) {
						violations.push(`[${fileName}] mutation "${field.name}" must return a MutationResult type (e.g. ${topLevelType}MutationResult!), got "${field.returnType}"`);
						hasViolation = true;
					}
				}
			}
			return !hasViolation;
		}, 'GraphQL mutations must follow MutationResult conventions')
		.check();

	return violations;
}

export async function checkGraphqlSchemaInputNaming(config: GraphqlSchemaConventionsConfig): Promise<string[]> {
	if (!config.graphqlGlob) {
		throw new Error('checkGraphqlSchemaInputNaming requires graphqlGlob to be set');
	}

	const violations: string[] = [];
	const excluded = new Set(config.excludeFiles ?? []);

	await projectFiles()
		.inPath(config.graphqlGlob)
		.should()
		.adhereTo((file: FileInfo) => {
			const fileName = file.path.split('/').pop() ?? '';
			if (excluded.has(fileName)) return true;

			const content = file.content;
			const defs = parseDefinitions(content);

			const inputDefs = defs.filter((d) => d.kind === 'input');

			let hasViolation = false;
			for (const inp of inputDefs) {
				if (!inp.name.endsWith('Input')) {
					violations.push(`[${fileName}] input type "${inp.name}" must end with "Input"`);
					hasViolation = true;
				}
			}
			return !hasViolation;
		}, 'GraphQL input types must follow naming conventions')
		.check();

	return violations;
}

function getDefinitionOrderCategory(def: ParsedDefinition, topLevelType: string): number {
	if (def.kind === 'extend' && def.extendedKind === 'Query') return 5;
	if (def.kind === 'extend' && def.extendedKind === 'Mutation') return 6;
	if (def.kind === 'extend') return 5;
	if (def.kind === 'input') return 3;
	if (def.kind === 'enum') return 2;
	if (def.kind === 'type' && def.name.endsWith('MutationResult')) return 4;
	if (def.kind === 'type' && def.name === topLevelType) return 0;
	if (def.kind === 'type') return 1;
	if (def.kind === 'union') return 1;
	if (def.kind === 'interface') return 1;
	return 1;
}

const orderCategoryNames = ['top-level type', 'sub-types', 'enums', 'input types', 'MutationResult type', 'extend type Query', 'extend type Mutation'];

export async function checkGraphqlSchemaOrdering(config: GraphqlSchemaConventionsConfig): Promise<string[]> {
	if (!config.graphqlGlob) {
		throw new Error('checkGraphqlSchemaOrdering requires graphqlGlob to be set');
	}

	const violations: string[] = [];
	const excluded = new Set(config.excludeFiles ?? []);

	await projectFiles()
		.inPath(config.graphqlGlob)
		.should()
		.adhereTo((file: FileInfo) => {
			const fileName = file.path.split('/').pop() ?? '';
			if (excluded.has(fileName)) return true;

			const stem = fileName.replace('.graphql', '');
			const topLevelType = kebabToPascal(stem);
			const content = file.content;
			const defs = parseDefinitions(content);

			const sorted = [...defs].sort((a, b) => a.position - b.position);

			let maxCategorySoFar = -1;
			let maxCategoryName = '';
			let hasViolation = false;

			for (const def of sorted) {
				const category = getDefinitionOrderCategory(def, topLevelType);
				if (category < maxCategorySoFar) {
					const defLabel = def.kind === 'extend' ? `extend type ${def.extendedKind}` : `${def.kind} ${def.name}`;
					const categoryName = orderCategoryNames[category] ?? 'unknown';
					violations.push(`[${fileName}] "${defLabel}" (${categoryName}) appears after ${maxCategoryName} — expected order: TopLevelType → SubTypes → Enums → Inputs → MutationResult → Query → Mutation`);
					hasViolation = true;
				} else if (category > maxCategorySoFar) {
					maxCategorySoFar = category;
					const defLabel = def.kind === 'extend' ? `extend type ${def.extendedKind}` : `${def.kind} ${def.name}`;
					maxCategoryName = `"${defLabel}" (${orderCategoryNames[category] ?? 'unknown'})`;
				}
			}
			return !hasViolation;
		}, 'GraphQL definitions must follow proper ordering')
		.check();

	return violations;
}

export async function checkGraphqlSchemaConventions(config: GraphqlSchemaConventionsConfig): Promise<string[]> {
	if (!config.graphqlGlob) {
		throw new Error('checkGraphqlSchemaConventions requires graphqlGlob to be set');
	}

	return [
		...(await checkGraphqlSchemaFileNaming(config)),
		...(await checkGraphqlSchemaTypePrefixing(config)),
		...(await checkGraphqlSchemaMutationResults(config)),
		...(await checkGraphqlSchemaInputNaming(config)),
		...(await checkGraphqlSchemaOrdering(config)),
	];
}
