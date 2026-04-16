// Markdown utility helpers for the cellix-tdd evaluator

export function normalizeHeading(value: string): string {
	return value.trim().toLowerCase();
}

export function parseMarkdownSections(markdown: string): Map<string, string> {
	const matches = [...markdown.matchAll(/^##\s+(.+)$/gm)];
	const sections = new Map<string, string>();

	for (let index = 0; index < matches.length; index += 1) {
		const current = matches[index];
		const next = matches[index + 1];
		const heading = normalizeHeading(current[1] ?? "");
		const start = (current.index ?? 0) + current[0].length;
		const end = next?.index ?? markdown.length;
		const body = markdown.slice(start, end).trim();
		sections.set(heading, body);
	}

	return sections;
}

export function isTemplateBoilerplate(value: string): boolean {
	// Accept several common placeholder patterns. The previous `\bTODO:\b` pattern
	// failed to match `TODO: ` because the trailing word-boundary after `:` is not
	// reliable. Use a more permissive check for TODO markers.
	return /\bTODO\b:?/i.test(value) || /\breplace this section\b/i.test(value) || /\{\{.+\}\}/.test(value);
}

export function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function hasHeading(markdown: string, heading: string): boolean {
	const pattern = new RegExp(`^##\\s+${escapeRegExp(heading)}\\s*$`, "im");
	return pattern.test(markdown);
}
