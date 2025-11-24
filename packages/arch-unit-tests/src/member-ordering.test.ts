import { projectFiles } from "archunit";
import { describe, expect, it } from "vitest";
import { checkMemberOrdering, defaultMemberOrder } from "./member-ordering-rule.ts";

describe("Member ordering", () => {
  it("classes should follow our member ordering", async () => {
    const ruleDesc =
      "Classes must use member ordering: static fields → instance fields → constructor → static methods → instance methods";

    const violations = await projectFiles()
      .inFolder("../ocom/domain/src/**")
      .withName("*.ts")
      .should()
      .adhereTo((file) => {
        if (file.name.includes('.test')) {
            return true; // Skip test files
        }
        return checkMemberOrdering(file, defaultMemberOrder) === true;
      }, ruleDesc)
      .check();

    expect(violations).toStrictEqual([]);
  });
});