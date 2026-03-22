import { projectFiles } from "archunit";
import { describe, expect, it } from "vitest";
import { checkMemberOrdering, defaultMemberOrder } from "./member-ordering-rule.ts";

describe("Member ordering", () => {
  it("classes should follow our member ordering", async () => {

    const ruleDesc = "Classes must use member ordering: static fields → instance fields → constructor → static methods → instance methods";

    const allViolations: string[] = [];

    await projectFiles()
      .inFolder("../ocom/domain/src/**")
      .withName("*.ts")
      .should()
      .adhereTo((file) => {
        if (file.name.includes('.test')) {
          return true; // Skip test files
        }
        const result = checkMemberOrdering(file, defaultMemberOrder);
        if (Array.isArray(result) && result.length > 0) {
          allViolations.push(`[${file.path}]\n${result.map(v => '  - ' + v).join('\n')}`);
          return false;
        }
        return true;
      }, ruleDesc)
      .check();

    if (allViolations.length > 0) {
      // Fail with a detailed report
      throw new Error(`Member ordering violations found:\n${allViolations.join('\n\n')}`);
    }
    // If no violations, test passes
    expect(allViolations).toStrictEqual([]);
  }, 30000);
});