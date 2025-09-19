---
sidebar_position: 16
sidebar_label: 0016 SonarCloud Code Duplication Checks
description: "Decision record for bypassing SonarCloud code duplication checks for unit tests."
status: proposed
contact: nnoce14 etang93
date: 2025-08-01
deciders: gidich etang93 mgupta83 nnoce14 iwilson dheruwala
consulted:
informed:
---

# Bypassing SonarCloud Code Duplication Checks for Unit Tests

## Context and Problem Statement

SonarCloud performs code duplication checks as part of its static analysis. While these checks are valuable for maintaining clean and maintainable code, they are less relevant for unit tests, where duplication is often intentional and unavoidable. Increasing the duplication threshold to accommodate unit tests would compromise the quality of non-test code. To address this, the team has decided to bypass duplication checks specifically for unit test files.

## Decision Drivers

- Avoid false positives in duplication checks for unit tests
- Maintain a strict duplication threshold for non-test code
- Improve developer productivity by reducing unnecessary warnings
- Ensure code quality remains high for production code

## Considered Options

- **Bypass duplication checks for unit tests**: Exclude unit test files from duplication checks in SonarCloud.
- **Increase the duplication threshold**: Raise the threshold globally to accommodate unit tests.

## Decision Outcome

Chosen option: **Bypass duplication checks for unit tests**

The team has decided to exclude unit test files from duplication checks in SonarCloud. This ensures that duplication warnings are meaningful for production code while avoiding unnecessary noise for unit tests.

### Consequences

- Good: Reduces false positives in duplication checks, improving developer productivity.
- Good: Maintains strict duplication thresholds for non-test code, ensuring high code quality.
- Bad: Requires configuration changes in SonarCloud to exclude unit test files.

## Validation

- Verify that duplication warnings are no longer triggered for unit test files.
- Ensure that duplication checks remain strict for non-test code.
- Monitor SonarCloud reports to confirm the effectiveness of the exclusion.

## Pros and Cons of the Options

### Bypass duplication checks for unit tests

- Good, because it avoids false positives and unnecessary warnings for unit tests.
- Good, because it maintains strict duplication thresholds for production code.
- Neutral, because it requires configuration changes in SonarCloud.
- Bad, because it may require ongoing maintenance if test file patterns change.

### Increase the duplication threshold

- Good, because it avoids duplication warnings for unit tests without configuration changes.
- Neutral, because it applies globally, potentially reducing code quality for production code.
- Bad, because it compromises the strictness of duplication checks for non-test code.

## More Information

The team will update the SonarCloud configuration to exclude unit test files from duplication checks. This will be done by specifying file patterns or directories in the exclusion settings. The decision may be revisited if the exclusion impacts other aspects of code analysis.

> For ongoing reference, see [SonarCloud documentation](https://sonarcloud.io/documentation).