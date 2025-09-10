---
sidebar_position: 15
sidebar_label: 0015 SonarCloud Node16 EOL
description: "Decision record for addressing Node.js 16 end-of-life in SonarCloud."
status: proposed
contact: gidich etang93
date: 2025-08-01
deciders: gidich etang93 mgupta83 nnoce14 iwilson dheruwala
consulted:
informed:
---

# Addressing Node.js 16 End-of-Life in SonarCloud

## Context and Problem Statement

The SonarCloud Azure DevOps extension currently relies on Node.js 16, which has reached its end-of-life (EOL). This creates a potential security and compatibility risk for our CI/CD pipelines. The SonarSource team has acknowledged the issue and plans to release an update within a week to address this. Until the update is available, the team must decide whether to continue using the current extension or implement a temporary workaround.

For more details, see the official discussion: [SonarCloud Node.js 16 EOL Issue](https://community.sonarsource.com/t/azure-devops-sonarcloudprepare-3-node-version-16-eol/144609/18).

## Decision Drivers

- Security risks associated with using an EOL Node.js version
- Compatibility with existing CI/CD workflows
- Timeline for the SonarSource team's resolution
- Effort required to implement a temporary workaround

## Considered Options

- **Continue using the current SonarCloud extension**: Accept the temporary risk and wait for the SonarSource team's update.
- **Implement a temporary workaround**: Modify the pipeline to use a custom script or alternative tool until the update is available.

## Decision Outcome

Chosen option: **Continue using the current SonarCloud extension**

The team has decided to accept the temporary risk and wait for the SonarSource team's update, which is expected within a week. This minimizes disruption to existing workflows and avoids unnecessary effort to implement a workaround.

### Consequences

- Good: The decision avoids unnecessary changes to the pipeline and maintains compatibility with existing workflows.
- Bad: There is a temporary security risk associated with using an EOL Node.js version.

## Validation

- Monitor the SonarSource community thread for updates on the issue.
- Verify the updated extension resolves the Node.js 16 EOL issue once released.
- Ensure the pipeline remains functional and secure during the interim period.

## Pros and Cons of the Options

### Continue using the current SonarCloud extension

- Good, because it avoids disruption to existing workflows.
- Good, because the issue is expected to be resolved within a week.
- Neutral, because the security risk is temporary and limited in scope.
- Bad, because it relies on an EOL Node.js version during the interim period.

### Implement a temporary workaround

- Good, because it eliminates the security risk associated with Node.js 16 EOL.
- Neutral, because it requires additional effort to implement and test.
- Bad, because it disrupts existing workflows and may introduce compatibility issues.

## More Information

The team will monitor the SonarSource community thread for updates and verify the resolution once the updated extension is released. If the timeline for the update changes or additional risks are identified, the decision may be revisited.

> For ongoing reference, see the official discussion: [SonarCloud Node.js 16 EOL Issue](https://community.sonarsource.com/t/azure-devops-sonarcloudprepare-3-node-version-16-eol/144609/18).