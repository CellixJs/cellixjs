import { describe, expect, it } from "vitest";

import { mergeHeaders } from "./index.ts";

describe("mergeHeaders", () => {
	it("normalizes keys before merging", () => {
		expect(
			mergeHeaders({ Accept: "application/json" }, { accept: "text/plain" }),
		).toEqual({
			accept: "text/plain",
		});
	});
});
