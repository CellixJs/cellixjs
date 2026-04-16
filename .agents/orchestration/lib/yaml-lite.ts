function parseScalar(rawValue: string): unknown {
	const value = rawValue.trim();

	if (value === '[]') {
		return [];
	}

	if (value === 'true') {
		return true;
	}

	if (value === 'false') {
		return false;
	}

	if (/^-?\d+$/.test(value)) {
		return Number.parseInt(value, 10);
	}

	if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
		return value.slice(1, -1);
	}

	return value;
}

interface PreparedLine {
	indent: number;
	text: string;
}

function prepareLines(text: string): PreparedLine[] {
	return text
		.split('\n')
		.map((line) => line.replace(/\r$/, ''))
		.filter((line) => {
			const trimmed = line.trim();
			return trimmed.length > 0 && !trimmed.startsWith('#');
		})
		.map((line) => ({
			indent: line.match(/^ */)?.[0].length ?? 0,
			text: line.trim(),
		}));
}

function parseArray(lines: PreparedLine[], startIndex: number, indent: number): [unknown[], number] {
	const values: unknown[] = [];
	let index = startIndex;

	while (index < lines.length) {
		const line = lines[index];
		if (line.indent < indent) {
			break;
		}

		if (line.indent !== indent || !line.text.startsWith('- ')) {
			throw new Error(`Invalid array item near "${line.text}"`);
		}

		values.push(parseScalar(line.text.slice(2)));
		index += 1;
	}

	return [values, index];
}

function parseMapping(lines: PreparedLine[], startIndex: number, indent: number): [Record<string, unknown>, number] {
	const value: Record<string, unknown> = {};
	let index = startIndex;

	while (index < lines.length) {
		const line = lines[index];
		if (line.indent < indent) {
			break;
		}

		if (line.indent !== indent || line.text.startsWith('- ')) {
			throw new Error(`Invalid mapping entry near "${line.text}"`);
		}

		const separatorIndex = line.text.indexOf(':');
		if (separatorIndex < 0) {
			throw new Error(`Missing key separator near "${line.text}"`);
		}

		const key = line.text.slice(0, separatorIndex).trim();
		const inlineValue = line.text.slice(separatorIndex + 1).trim();

		if (inlineValue.length > 0) {
			value[key] = parseScalar(inlineValue);
			index += 1;
			continue;
		}

		const nextLine = lines[index + 1];
		if (!nextLine || nextLine.indent <= line.indent) {
			value[key] = {};
			index += 1;
			continue;
		}

		if (nextLine.text.startsWith('- ')) {
			const [arrayValue, nextIndex] = parseArray(lines, index + 1, nextLine.indent);
			value[key] = arrayValue;
			index = nextIndex;
			continue;
		}

		const [mappingValue, nextIndex] = parseMapping(lines, index + 1, nextLine.indent);
		value[key] = mappingValue;
		index = nextIndex;
	}

	return [value, index];
}

export function parseYamlLite(text: string): Record<string, unknown> {
	const lines = prepareLines(text);
	if (lines.length === 0) {
		return {};
	}

	const [parsedValue, nextIndex] = parseMapping(lines, 0, lines[0].indent);
	if (nextIndex !== lines.length) {
		throw new Error('Unexpected trailing YAML content');
	}

	return parsedValue;
}
