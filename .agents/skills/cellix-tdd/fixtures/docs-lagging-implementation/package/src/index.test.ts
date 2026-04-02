import { describe, expect, it } from "vitest";

import { readOptionalEnv, readRequiredEnv } from "./index.ts";

describe("readRequiredEnv", () => {
	it("throws when the value is missing", () => {
		expect(() => readRequiredEnv("MISSING_KEY")).toThrow(Error);
	});
});

describe("readOptionalEnv", () => {
	it("uses the provided default", () => {
		expect(readOptionalEnv("MISSING_KEY", "fallback")).toBe("fallback");
	});
});
