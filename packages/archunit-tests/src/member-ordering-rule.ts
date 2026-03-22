import type { FileInfo } from 'archunit';
import ts from 'typescript';

interface MemberOrderGroup {
	name: string;
	match(member: ts.ClassElement): boolean;
}

/**
 * Default order (you can tweak this):
 *  0. static fields
 *  1. instance fields
 *  2. constructor
 *  3. static methods
 *  4. instance methods
 *  5. static accessors
 *  6. instance accessors
 */
export const defaultMemberOrder: MemberOrderGroup[] = [
	{
		name: 'static fields',
		match: (m) =>
			ts.isPropertyDeclaration(m) &&
			hasModifier(m, ts.SyntaxKind.StaticKeyword),
	},
	{
		name: 'instance fields',
		match: (m) =>
			ts.isPropertyDeclaration(m) &&
			!hasModifier(m, ts.SyntaxKind.StaticKeyword),
	},
	{
		name: 'constructor',
		match: (m) => ts.isConstructorDeclaration(m),
	},
	{
		name: 'static methods',
		match: (m) =>
			ts.isMethodDeclaration(m) && hasModifier(m, ts.SyntaxKind.StaticKeyword),
	},
	{
		name: 'instance methods',
		match: (m) =>
			ts.isMethodDeclaration(m) && !hasModifier(m, ts.SyntaxKind.StaticKeyword),
	},
	{
		name: 'static accessors',
		match: (m) =>
			(ts.isGetAccessorDeclaration(m) || ts.isSetAccessorDeclaration(m)) &&
			hasModifier(m, ts.SyntaxKind.StaticKeyword),
	},
	{
		name: 'instance accessors',
		match: (m) =>
			(ts.isGetAccessorDeclaration(m) || ts.isSetAccessorDeclaration(m)) &&
			!hasModifier(m, ts.SyntaxKind.StaticKeyword),
	},
];

// Utility: check for a specific modifier
function hasModifier(node: ts.Node, kind: ts.SyntaxKind): boolean {
	// 'modifiers' is optional on many node types
	const { modifiers } = node as { modifiers?: ts.NodeArray<ts.ModifierLike> };
	return !!modifiers?.some((m) => ts.isModifier(m) && m.kind === kind);
}

// Utility: best-effort member “name” for logging
function getMemberName(member: ts.ClassElement): string {
	if (
		ts.isMethodDeclaration(member) ||
		ts.isPropertyDeclaration(member) ||
		ts.isGetAccessorDeclaration(member) ||
		ts.isSetAccessorDeclaration(member)
	) {
		if (member.name && ts.isIdentifier(member.name)) {
			return member.name.text;
		}
		if (member.name && ts.isStringLiteral(member.name)) {
			return member.name.text;
		}
	}
	if (ts.isConstructorDeclaration(member)) {
		return 'constructor';
	}
	return '<unknown>';
}

/**
 * Core checker used by ArchUnitTS custom rule.
 * Returns true if all classes in the file respect the ordering.
 */
export function checkMemberOrdering(
	file: FileInfo,
	groups: MemberOrderGroup[] = defaultMemberOrder,
): true | string[] {
	// Derive ScriptKind from file extension
	let scriptKind: ts.ScriptKind = ts.ScriptKind.TS;
	if (file.path.endsWith('.tsx')) {
		scriptKind = ts.ScriptKind.TSX;
	} else if (file.path.endsWith('.js')) {
		scriptKind = ts.ScriptKind.JS;
	} else if (file.path.endsWith('.jsx')) {
		scriptKind = ts.ScriptKind.JSX;
	} else if (file.path.endsWith('.json')) {
		scriptKind = ts.ScriptKind.JSON;
	}
	const source = ts.createSourceFile(
		file.path,
		file.content,
		ts.ScriptTarget.Latest,
		true,
		scriptKind,
	);

	const violations: string[] = [];

	const checkClass = (cls: ts.ClassDeclaration) => {
		const className = cls.name?.text ?? '<anonymous>';

		// Pick only members we care about, including accessors
		const relevantMembers = cls.members.filter(
			(m) =>
				ts.isPropertyDeclaration(m) ||
				ts.isConstructorDeclaration(m) ||
				ts.isMethodDeclaration(m) ||
				ts.isGetAccessorDeclaration(m) ||
				ts.isSetAccessorDeclaration(m),
		);

		const groupIndexes = relevantMembers.map((m) => {
			const idx = groups.findIndex((g) => g.match(m));
			// members that don't match any group are put at the end
			return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
		});

		let maxSoFar = -1;
		for (let i = 0; i < relevantMembers.length; i++) {
			const idx = groupIndexes[i] as number;
			const member = relevantMembers[i] as ts.ClassElement;

			if (idx < maxSoFar) {
				const memberName = getMemberName(member);
				const offendingGroup = groups[idx]?.name ?? 'unknown group';
				const previousGroup = groups[maxSoFar]?.name ?? 'unknown group';

				violations.push(
					`Class ${className}: member "${memberName}" (group: ${offendingGroup}) appears after a member from later group (${previousGroup}).`,
				);
			} else {
				maxSoFar = idx;
			}
		}
	};

	source.forEachChild((node) => {
		if (ts.isClassDeclaration(node)) {
			checkClass(node);
		}
	});

	if (violations.length > 0) {
		// Print to console for local runs
		console.error(`[ArchUnitTS member-ordering] ${file.path}`);
		for (const v of violations) {
			console.error(`  - ${v}`);
		}
        // Do not throw; just return violations
        return violations;
    }
    return true;
}
