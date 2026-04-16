import { describe, it, expect } from "vitest";
import { normalizeHeading, parseMarkdownSections, isTemplateBoilerplate, hasHeading, escapeRegExp } from "../markdown-utils";

describe("markdown-utils", () => {
	it("normalizeHeading trims and lowercases", () => {
		expect(normalizeHeading("  Hello WORLD  ")).toBe("hello world");
	});

	it("escapeRegExp escapes regex characters", () => {
		const raw = "a.b*c?";
		const escaped = escapeRegExp(raw);
		const re = new RegExp(`^${escaped}$`);
		expect(re.test(raw)).toBe(true);
	});

	it("parseMarkdownSections finds sections by headings", () => {
		const md = `# Title

## First Section

This is the first section.

## Second Section

Second content line 1
Second content line 2
`;
		const sections = parseMarkdownSections(md);
		expect(sections.get("first section")).toBe("This is the first section.");
		expect(sections.get("second section")).toBe("Second content line 1\nSecond content line 2");
	});

	it("isTemplateBoilerplate detects placeholders", () => {
		expect(isTemplateBoilerplate("TODO: fill this")).toBe(true);
		expect(isTemplateBoilerplate("replace this section with")).toBe(true);
		expect(isTemplateBoilerplate("{{placeholder}}")).toBe(true);
		expect(isTemplateBoilerplate("This is real content")).toBe(false);
	});

	it("hasHeading matches heading regardless of case", () => {
		const md = "## My Heading\n\ncontent";
		expect(hasHeading(md, "My Heading")).toBe(true);
		expect(hasHeading(md, "my heading")).toBe(true);
		expect(hasHeading(md, "Other")).toBe(false);
	});
});
