import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { type FileInfo, projectFiles } from 'archunit';
import { checkMemberOrdering as checkMemberOrderingRule } from '../utils/member-ordering-rule.js';

export interface MemberOrderingConfig {
	sourceGlobs: string[];
}

function isGlobPattern(pattern: string): boolean {
	return /[*?[\]{}]/.test(pattern);
}

export async function checkMemberOrdering(config: MemberOrderingConfig): Promise<string[]> {
	if (!config.sourceGlobs || config.sourceGlobs.length === 0) {
		throw new Error('checkMemberOrdering requires at least one sourceGlob to be set');
	}

	const allViolations: string[] = [];

	for (const glob of config.sourceGlobs) {
		if (!isGlobPattern(glob)) {
			const content = await readFile(glob, 'utf8');
			const parsedPath = path.parse(glob);
			const result = checkMemberOrderingRule({
				path: glob,
				name: parsedPath.name,
				extension: parsedPath.ext.replace(/^\./, ''),
				directory: parsedPath.dir,
				content,
				linesOfCode: content.split('\n').length,
			});

			if (result !== true) {
				allViolations.push(...result);
			}

			continue;
		}

		const archUnitViolations = await projectFiles()
			.inPath(glob)
			.should()
			.adhereTo((file: FileInfo) => {
				const result = checkMemberOrderingRule(file);
				if (result !== true) {
					allViolations.push(...result);
					return false;
				}
				return true;
			}, 'Class members must follow proper ordering')
			.check();

		for (const violation of archUnitViolations) {
			if (typeof violation === 'object' && violation !== null && 'message' in violation) {
				allViolations.push(String(violation.message));
			} else {
				allViolations.push(JSON.stringify(violation));
			}
		}
	}

	return allViolations;
}
