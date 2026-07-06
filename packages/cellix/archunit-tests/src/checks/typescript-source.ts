import ts from 'typescript';

interface ImportedBinding {
	imported: string;
	local: string;
}

export function parseTypeScript(filePath: string, content: string): ts.SourceFile {
	return ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true, filePath.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
}

function importedBindings(source: ts.SourceFile, moduleName: string): ImportedBinding[] {
	const bindings: ImportedBinding[] = [];
	for (const statement of source.statements) {
		if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier) || statement.moduleSpecifier.text !== moduleName) continue;
		for (const element of statement.importClause?.namedBindings && ts.isNamedImports(statement.importClause.namedBindings) ? statement.importClause.namedBindings.elements : []) {
			bindings.push({ imported: element.propertyName?.text ?? element.name.text, local: element.name.text });
		}
	}
	return bindings;
}

export function localImportName(source: ts.SourceFile, moduleName: string, importedName: string): string | undefined {
	return importedBindings(source, moduleName).find((binding) => binding.imported === importedName)?.local;
}

export function findImportedBinding(source: ts.SourceFile, importedName: string): (ImportedBinding & { moduleName: string }) | undefined {
	for (const statement of source.statements) {
		if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
		const binding = importedBindings(source, statement.moduleSpecifier.text).find((candidate) => candidate.imported === importedName);
		if (binding) return { ...binding, moduleName: statement.moduleSpecifier.text };
	}
	return undefined;
}

export function containsNewExpression(source: ts.Node, name: string): boolean {
	return someNode(source, (node) => ts.isNewExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === name);
}

export function containsCall(source: ts.Node, name: string): boolean {
	return someNode(source, (node) => {
		if (!ts.isCallExpression(node)) return false;
		return expressionName(node.expression) === name;
	});
}

export function callPositions(source: ts.SourceFile, names: readonly string[]): Map<string, number> {
	const positions = new Map<string, number>();
	someNode(source, (node) => {
		if (!ts.isCallExpression(node)) return false;
		const name = expressionName(node.expression);
		const matchedName = name && names.find((candidate) => name === candidate || (candidate === 'registerAzureFunction' && name.startsWith(candidate)));
		if (matchedName && !positions.has(matchedName)) {
			const positionNode = ts.isPropertyAccessExpression(node.expression) ? node.expression.name : node.expression;
			positions.set(matchedName, positionNode.getStart(source));
		}
		return false;
	});
	return positions;
}

export function callbackContainsCall(source: ts.SourceFile, callName: string, nestedCallName: string): boolean {
	let matches = false;
	someNode(source, (node) => {
		if (!ts.isCallExpression(node) || expressionName(node.expression) !== callName) return false;
		matches = node.arguments.some((argument) => (ts.isArrowFunction(argument) || ts.isFunctionExpression(argument)) && containsCall(argument.body, nestedCallName));
		return matches;
	});
	return matches;
}

export function callbackReturnsObject(source: ts.SourceFile, callName: string): boolean {
	let matches = false;
	someNode(source, (node) => {
		if (!ts.isCallExpression(node) || expressionName(node.expression) !== callName) return false;
		matches = node.arguments.some((argument) => {
			if (!ts.isArrowFunction(argument) && !ts.isFunctionExpression(argument)) return false;
			if (ts.isParenthesizedExpression(argument.body)) return ts.isObjectLiteralExpression(argument.body.expression);
			if (ts.isObjectLiteralExpression(argument.body)) return true;
			return ts.isBlock(argument.body) && argument.body.statements.some((statement) => ts.isReturnStatement(statement) && !!statement.expression && ts.isObjectLiteralExpression(statement.expression));
		});
		return matches;
	});
	return matches;
}

export function containsJsxTag(source: ts.SourceFile, tagName: string): boolean {
	return someNode(source, (node) => {
		if (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) return node.tagName.getText(source) === tagName;
		return false;
	});
}

/** Check whether a JSX component is on a rendered path between the React root and App. */
export function containsRenderedJsxWrapper(source: ts.SourceFile, wrapperName: string, childName = 'App'): boolean {
	const root = '__render_root__';
	const edges = new Map<string, Set<string>>();
	const connect = (parent: string, child: string): void => {
		const children = edges.get(parent) ?? new Set<string>();
		children.add(child);
		edges.set(parent, children);
	};

	someNode(source, (node) => {
		const tag = jsxTagName(node, source);
		if (!tag) return false;

		const parentTag = nearestJsxParentTag(node, source);
		if (parentTag) {
			connect(parentTag, tag);
		} else {
			const component = enclosingComponentName(node.parent);
			if (component) connect(component, tag);
		}
		return false;
	});

	someNode(source, (node) => {
		if (!ts.isCallExpression(node) || expressionName(node.expression) !== 'render') return false;
		for (const argument of node.arguments) {
			for (const tag of topLevelJsxTags(argument, source)) connect(root, tag);
		}
		return false;
	});

	return isReachable(edges, root, wrapperName) && isReachable(edges, wrapperName, childName);
}

/** Check whether a resolved DOM mount point is protected by an explicit guard. */
export function containsMountPointGuard(source: ts.SourceFile, elementId: string): boolean {
	const mountNames = new Set<string>();
	someNode(source, (node) => {
		if (!ts.isVariableDeclaration(node) || !ts.isIdentifier(node.name) || !node.initializer) return false;
		if (isElementLookup(node.initializer, elementId) || (ts.isCallExpression(node.initializer) && node.initializer.arguments.some((argument) => isElementLookup(argument, elementId)))) {
			mountNames.add(node.name.text);
		}
		return false;
	});

	return someNode(source, (node) => {
		if (ts.isIfStatement(node) && checksMissingValue(node.expression, mountNames)) {
			return someNode(node.thenStatement, (child) => ts.isThrowStatement(child) || ts.isReturnStatement(child));
		}
		if (!ts.isCallExpression(node) || !/^(assert|ensure|guard|invariant|require|validate)/i.test(expressionName(node.expression) ?? '')) return false;
		return node.arguments.some((argument) => referencesAnyIdentifier(argument, mountNames) || isElementLookup(argument, elementId));
	});
}

function checksMissingValue(node: ts.Expression, names: ReadonlySet<string>): boolean {
	if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.ExclamationToken) {
		return referencesAnyIdentifier(node.operand, names);
	}
	if (!ts.isBinaryExpression(node)) return false;
	if (![ts.SyntaxKind.EqualsEqualsToken, ts.SyntaxKind.EqualsEqualsEqualsToken].includes(node.operatorToken.kind)) return false;
	return (referencesAnyIdentifier(node.left, names) && isNullish(node.right)) || (isNullish(node.left) && referencesAnyIdentifier(node.right, names));
}

function isNullish(node: ts.Expression): boolean {
	return node.kind === ts.SyntaxKind.NullKeyword || (ts.isIdentifier(node) && node.text === 'undefined');
}

function jsxTagName(node: ts.Node, source: ts.SourceFile): string | undefined {
	if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) return node.tagName.getText(source);
	return undefined;
}

function nearestJsxParentTag(node: ts.Node | undefined, source: ts.SourceFile): string | undefined {
	for (let current = node?.parent; current; current = current.parent) {
		if (ts.isJsxElement(current) && current.openingElement !== node) return current.openingElement.tagName.getText(source);
		if (ts.isFunctionLike(current)) return undefined;
	}
	return undefined;
}

function enclosingComponentName(node: ts.Node | undefined): string | undefined {
	for (let current = node; current; current = current.parent) {
		if (ts.isFunctionDeclaration(current) && current.name) return current.name.text;
		if ((ts.isArrowFunction(current) || ts.isFunctionExpression(current)) && ts.isVariableDeclaration(current.parent) && ts.isIdentifier(current.parent.name)) return current.parent.name.text;
	}
	return undefined;
}

function topLevelJsxTags(node: ts.Node, source: ts.SourceFile): string[] {
	const tags: string[] = [];
	const visit = (current: ts.Node): void => {
		const tag = jsxTagName(current, source);
		if (tag) {
			tags.push(tag);
			return;
		}
		current.forEachChild(visit);
	};
	visit(node);
	return tags;
}

function isReachable(edges: ReadonlyMap<string, ReadonlySet<string>>, from: string, to: string, seen = new Set<string>()): boolean {
	if (from === to) return true;
	if (seen.has(from)) return false;
	seen.add(from);
	return [...(edges.get(from) ?? [])].some((child) => isReachable(edges, child, to, seen));
}

function isElementLookup(node: ts.Node, elementId: string): boolean {
	return ts.isCallExpression(node) && expressionName(node.expression) === 'getElementById' && node.arguments.some((argument) => ts.isStringLiteral(argument) && argument.text === elementId);
}

function referencesAnyIdentifier(node: ts.Node, names: ReadonlySet<string>): boolean {
	return someNode(node, (child) => ts.isIdentifier(child) && names.has(child.text));
}

function expressionName(expression: ts.LeftHandSideExpression): string | undefined {
	if (ts.isIdentifier(expression)) return expression.text;
	if (ts.isPropertyAccessExpression(expression)) return expression.name.text;
	return undefined;
}

function someNode(node: ts.Node, predicate: (node: ts.Node) => boolean): boolean {
	if (predicate(node)) return true;
	let found = false;
	node.forEachChild((child) => {
		if (!found && someNode(child, predicate)) found = true;
	});
	return found;
}
