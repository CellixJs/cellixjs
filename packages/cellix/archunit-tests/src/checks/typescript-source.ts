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
		if (matchedName && !positions.has(matchedName)) positions.set(matchedName, node.getStart(source));
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

export function containsIfThrow(source: ts.SourceFile): boolean {
	return someNode(source, (node) => ts.isIfStatement(node) && someNode(node.thenStatement, ts.isThrowStatement));
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
