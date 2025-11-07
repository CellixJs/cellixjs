---
sidebar_position: 22
sidebar_label: 0022 Snyk Security Integration
description: "Decision record for integrating Snyk for security scanning in development and CI/CD."
status: accepted
contact: nnoce14
date: 2025-11-06
deciders: gidich etang93 mgupta83 nnoce14 iwilson dheruwala
consulted: gidich
informed:
---

# Integrate Snyk for Security Scanning at Inception

## Context and Problem Statement

Security vulnerabilities in dependencies and source code pose significant risks to production applications. Traditional security scanning approaches often identify vulnerabilities too late in the development lifecycle, making remediation more costly and time-consuming. 

The CellixJS project already uses SonarCloud for **quality gates on PRs**, which enforces:
- Code coverage thresholds for tests
- Detection of code smells and technical debt
- General code quality metrics
- Some security hotspot detection and basic security analysis

However, SonarCloud is primarily a **code quality platform**, and while it performs some security analysis, it lacks the robustness and specialization needed for comprehensive security scanning. The team needs a dedicated **security-focused tool** that specializes in:
- **Dependency vulnerability scanning (SCA)**: Detecting CVEs in npm packages and transitive dependencies
- **Security-focused SAST**: Identifying security vulnerabilities in source code (injection attacks, authentication issues, etc.)
- **Infrastructure-as-code security**: Scanning Bicep templates for Azure security misconfigurations and compliance issues

The goal is to establish **dual quality gates**:
1. **SonarCloud Quality Gate**: Code quality, test coverage, code smells
2. **Snyk Security Gate**: Dependency vulnerabilities, security issues in code, IaC misconfigurations

The CellixJS project requires a security solution that enables:
1. **Local development security scanning**: Developers and AI agents can run Snyk CLI locally to catch security issues before committing code
2. **CI/CD security gating**: The same Snyk CLI commands run in CI pipelines to block PRs that introduce security vulnerabilities
3. **Consistent security workflow**: Identical scanning logic locally and in CI/CD ensures no surprises
4. **Comprehensive security coverage**: SCA for dependencies, SAST for source code, IaC for infrastructure configurations
5. **"Security at inception"**: Catch vulnerabilities during code generation by AI agents and in local development, not just in CI/CD
6. **Continuous monitoring**: Maintain a Snyk project in the Snyk Web UI that tracks vulnerabilities and security status over time, updated automatically by main branch builds

The challenge is to implement this security-focused workflow that complements (not duplicates) the existing SonarCloud quality gates.

## Decision Drivers

- **Dual quality gates**: Establish separate gates for code quality (SonarCloud) and security (Snyk)
- **Security specialization**: Need a tool focused specifically on security vulnerabilities, not general code quality
- **Dependency vulnerability scanning**: Detect CVEs in npm packages and transitive dependencies (SCA)
- **Security-focused SAST**: Identify security-specific issues (injection, auth, crypto) in source code
- **Infrastructure-as-code security**: Scan Bicep templates for Azure security misconfigurations
- **Local + CI/CD consistency**: Same CLI commands work identically for developers locally and in CI pipelines
- **Shift-left security**: Catch vulnerabilities during local development and AI code generation
- **CI/CD security gate**: Block PRs that introduce new security vulnerabilities
- **Developer and AI agent friendly**: Easy to run locally before committing code
- **Monorepo support**: Handle multi-package workspace structure effectively
- **Actionable security guidance**: Provide clear remediation steps for security issues
- **Policy management**: Support ignore policies for accepted security risks with expiration dates
## Considered Options

- **Snyk**: Developer-first security platform with CLI, IDE extensions, and comprehensive scanning (SCA, SAST, IaC)
- **Expand SonarCloud usage**: Rely solely on SonarCloud's security features (not recommended for reasons detailed below)

## Decision Outcome

Chosen option: **Snyk** with integrated CLI-based scanning in local development and CI/CD.

Snyk provides the specialized security focus needed to complement SonarCloud's quality gates. The CLI-based approach ensures **identical security scanning** whether a developer runs it locally, an AI agent runs it during code generation, or the CI pipeline runs it on a PR - eliminating surprises and establishing a true security gate.

### Dual Quality Gate Strategy

**SonarCloud Quality Gate** (existing):
- Code coverage enforcement
- Code smells and technical debt tracking
- Maintainability and reliability metrics
- General code quality standards
- Basic security analysis (security hotspots, some vulnerability detection)

**Snyk Security Gate** (new):
- Dependency vulnerability detection (SCA)
- Security-specific code vulnerabilities (SAST)
- Infrastructure-as-code security misconfigurations (IaC)
- Blocks PRs with high/critical security issues

### Implementation Strategy

#### 1. **Local Development Integration**

**Installation and Authentication**:
```bash
# Install Snyk CLI (global or dev dependency)
npm install -g snyk
# or in package.json devDependencies
pnpm add -D snyk

# Authenticate (one-time per machine)
snyk auth <TOKEN>
# or set environment variable
export SNYK_TOKEN="<TOKEN>"
```

**NPM Scripts for Developer Ergonomics** (`package.json`):
```json
{
  "scripts": {
    "snyk:test": "snyk test --all-projects --org=cellixjs --remote-repo-url=https://github.com/CellixJs/cellixjs --policy-path=.snyk",
    "snyk:monitor": "snyk monitor --all-projects --org=cellixjs --target-reference=main --remote-repo-url=https://github.com/CellixJs/cellixjs --policy-path=.snyk",
    "snyk:code": "snyk code test --org=cellixjs --remote-repo-url=https://github.com/CellixJs/cellixjs --policy-path=.snyk",
    "snyk:code:report": "snyk code test --org=cellixjs --remote-repo-url=https://github.com/CellixJs/cellixjs --target-reference=main --project-name=cellixjs-code --report --policy-path=.snyk",
    "snyk:iac": "snyk iac test",
    "snyk": "pnpm run snyk:test && pnpm run snyk:code && pnpm run snyk:iac"
  }
}
```

#### 3. **CI/CD Integration**

**Azure Pipelines Implementation**:

The Snyk CLI is integrated into the build stage with different behaviors for PR vs. main branch builds, establishing the **Snyk Security Gate** that works alongside the existing SonarCloud quality gate:

```yaml
# Audit security vulnerabilities with Snyk CLI
- task: Bash@3
  displayName: 'Audit security vulnerabilities with Snyk CLI'
  inputs:
    targetType: 'inline'
    script: |
      set -euo pipefail
      
      # Verify environment variables
      if [ -z "$SNYK_TOKEN" ]; then
        echo "Error: SNYK_TOKEN is empty or not loaded."
        exit 1
      fi
      
      # Authenticate Snyk CLI
      echo "Authenticating Snyk CLI..."
      pnpm exec snyk auth "$SNYK_TOKEN"
      
      echo "Running Snyk to detect security vulnerabilities..."
      # If PR build, run test commands (SECURITY GATE - will fail PR on high/critical issues)
      if [ "$(Build.Reason)" = "PullRequest" ]; then
        echo "Running Snyk for PR build..."
        pnpm run snyk:code      # SAST - fail on security vulnerabilities in code
        pnpm run snyk:test      # SCA - fail on vulnerable dependencies
      else
        # Main branch: report to Snyk dashboard and monitor
        echo "Running Snyk for main branch build..."
        pnpm run snyk:code:report
        pnpm run snyk:monitor
      fi
    workingDirectory: ''
  env:
    SNYK_TOKEN: $(SNYK_TOKEN)
```

**PR Builds (Security Gate)**:
- Run `snyk:code` (SAST) to detect security vulnerabilities in source code
- Run `snyk:test` (SCA) to check for vulnerable dependencies
- **FAIL THE BUILD** if high/critical vulnerabilities are found - **this is the security gate**
- Provide immediate feedback in PR checks
- Works alongside SonarCloud quality gate (both must pass for PR to merge)

**Main Branch Builds (Monitoring)**:
- Run `snyk:code:report` to report SAST results to Snyk Web UI dashboard
- Run `snyk:monitor` to update the Snyk project with current dependency snapshot
- **Updates Snyk Web UI project**: After each merge to main, these commands update the CellixJS project in Snyk Web UI with the current vulnerability snapshot
- Track security trends, newly disclosed vulnerabilities, and remediation progress over time in Snyk UI
- Enables proactive security monitoring even for vulnerabilities disclosed after code was merged

#### 4. **Policy Management**

**Ignore Policy** (`.snyk` file):
```yaml
version: v1.5.0
ignore:
  'SNYK-JS-SIRV-12558119':
    - '* > sirv@2.0.4':
        reason: 'Transitive dependency in Docusaurus; not exploitable in static site serving context (dev-only asset handler)'
        expires: '2026-11-20T00:00:00.000Z'
        created: '2024-11-06T15:57:00.000Z'
```

The `.snyk` policy file allows teams to:
- Document known false positives or accepted risks when no remediation is available
- Set expiration dates for ignore rules (forcing periodic review)
- Provide business justification for accepting risks
- Share policies across local development and CI/CD

**Governance**: The `.snyk` file is specified in `CODEOWNERS`, requiring senior developer approval for any changes. This ensures proper risk assessment and prevents casual ignoring of security vulnerabilities.

#### 5. **Scan Coverage**

**SCA (Software Composition Analysis)**:
- Scans `package.json`, `package-lock.json`, `pnpm-lock.yaml` in all workspace packages
- Detects known CVEs in direct and transitive dependencies
- Provides upgrade paths and fix recommendations

**SAST (Static Application Security Testing)**:
- Analyzes TypeScript/JavaScript source code for security vulnerabilities
- Detects issues like SQL injection, XSS, insecure crypto, authentication flaws
- Provides actionable remediation guidance

**IaC (Infrastructure as Code)**:
- Scans Bicep templates (`*.bicep`) for Azure security misconfigurations
- Checks for insecure resource configurations, missing encryption, overly permissive access
- Validates against Azure security best practices

#### 6. **AI Agent Integration**

**GitHub Copilot Snyk Rules** (`.github/instructions/snyk_rules.instructions.md`):
```markdown
# Project security best practices

- Always run snyk_code_scan tool for new first party code that is generated in a Snyk-supported language.
- If any security issues are found based on newly introduced or modified code or dependencies, attempt to fix the issues using the results context from Snyk.
- Rescan the code after fixing the issues to ensure that the issues were fixed and that there are no newly introduced issues.
- Repeat this process until no new issues are found.
```

AI agents automatically run Snyk SAST scans on generated code, ensuring **security at inception** - catching vulnerabilities during code generation before they're even committed.

## Consequences

### Positive Consequences
- **Clear separation of concerns**: SonarCloud enforces code quality gates (coverage, code smells), Snyk enforces security gates (CVEs, vulnerabilities, IaC)
- **Specialized security focus**: Snyk is purpose-built for security, not a general-purpose quality tool trying to do security
- **Comprehensive dependency scanning**: Detects CVEs in npm packages and transitive dependencies - critical capability SonarCloud doesn't provide
- **IaC security scanning**: Thoroughly scans Bicep templates for Azure security misconfigurations
- **Local + CI consistency**: Developers run the exact same `pnpm run snyk:*` commands locally that CI runs, eliminating surprises
- **Shift-left security**: Security issues caught during code generation by AI agents and in local development before commit
- **True security gate**: PR builds fail on high/critical vulnerabilities, preventing insecure code from merging
- **Developer-friendly**: CLI integration and npm scripts provide familiar, easy-to-use workflows
- **Monorepo support**: `--all-projects` flag handles workspace structure automatically
- **Policy management**: `.snyk` file enables documented risk acceptance with expiration dates
- **Continuous monitoring via Snyk Web UI**: Main branch builds automatically update the CellixJS project in Snyk Web UI, tracking vulnerability trends and security health over time
- **Proactive alerting**: Snyk Web UI monitors for newly disclosed CVEs affecting our dependencies, even after code is merged
- **Actionable security feedback**: Provides clear remediation guidance, upgrade paths, and fix PRs specifically for security issues

### Neutral Consequences
- **Dual tool workflow**: Developers check SonarCloud for quality issues and Snyk for security issues - but this clear separation is actually beneficial
- **Learning curve**: Developers need to learn Snyk CLI commands and policy syntax (minimal investment)

### Negative Consequences
- **Both gates must pass**: PRs require passing both SonarCloud quality gate and Snyk security gate
- **False positives**: Some vulnerabilities may not be exploitable in specific contexts, requiring policy management
- **Token management**: Requires secure handling of `SNYK_TOKEN` in environment variables and CI/CD secrets
- **Cost**: Snyk is free for open-source projects but requires paid plans for private repositories with advanced features

## Validation

### Local Development Validation
- Developers must run `pnpm run verify` at least once before committing changes to a PR
- AI agents automatically run `snyk_code_scan` tool after generating code
- Results are displayed in terminal with actionable remediation steps
- **Remediation expectations**:
  - Prioritize by severity: Critical → High → Medium → Low
  - All issues must be investigated and resolved if possible (including low severity)
  - If no remediation is available, document in `.snyk` file with justification and request CODEOWNERS approval

### CI/CD Validation
- **PR security gate**: PR builds fail if high/critical vulnerabilities are detected by Snyk
- Snyk results are visible in Azure Pipelines build logs alongside SonarCloud quality gate results
- **Both gates must pass**: Snyk security gate AND SonarCloud quality gate must pass before PR can merge
- Developers can check build logs on Azure DevOps if gates fail (ideally won't happen since developers can run commands locally first)
- **Main branch monitoring**: Main branch builds update the CellixJS project in Snyk Web UI with current security snapshot
- **Snyk Web UI project**: Team can view security trends, vulnerability history, and remediation progress in Snyk dashboard

## Pros and Cons of the Options

### Snyk

- Good, because it provides comprehensive SCA, SAST, and IaC scanning in one platform
- Good, because the CLI enables consistent workflows across development and CI/CD
- Good, because it has excellent TypeScript/JavaScript and Azure support
- Good, because it integrates with AI agent workflows for automatic security scanning
- Good, because it provides security-specific remediation guidance and fix PRs
- Neutral, because it requires managing an additional tool alongside SonarCloud
- Bad, because it requires a paid plan for private repositories with advanced features

### Expand SonarCloud usage (rely solely on existing tool)

- Good, because it's already integrated and familiar to the team
- Good, because it provides some security hotspot detection and basic security analysis for source code
- Good, because it provides quality gates for code coverage and code smells
- Neutral, because it focuses primarily on code quality (coverage, smells, maintainability) rather than security vulnerabilities
- Neutral, because its security analysis is less robust and specialized compared to dedicated security tools
- Bad, because it has **no meaningful SCA capabilities** - doesn't scan npm dependencies for CVEs
- Bad, because it doesn't detect vulnerable transitive dependencies in the dependency tree
- Bad, because its SAST focuses on general code quality, not security-specific vulnerabilities (injection, auth, crypto)
- Bad, because IaC security scanning is minimal compared to dedicated security tools
- Bad, because it doesn't provide security-specific remediation guidance for dependency vulnerabilities
- Bad, because it doesn't integrate with AI agent workflows for security scanning
- **Bad, because code quality and security are fundamentally different concerns that need specialized tools**
- **Bad, because using a quality gate tool as a security gate leaves critical security gaps (no dependency CVE detection)**

## More Information

### Documentation
- **Getting Started Guide**: See the [Introduction](../intro.md) documentation for local Snyk authentication and usage
- **Snyk Instructions**: `.github/instructions/snyk_rules.instructions.md` contains AI agent rules for automatic scanning

### References
- [Snyk CLI Documentation](https://docs.snyk.io/snyk-cli)
- [Snyk for Azure Pipelines](https://docs.snyk.io/integrations/ci-cd-integrations/azure-pipelines-integration)
- [Snyk Policy File Documentation](https://docs.snyk.io/snyk-cli/test-for-vulnerabilities/the-.snyk-file)
- [Snyk for Monorepos](https://docs.snyk.io/scan-applications/supported-languages-and-frameworks/monorepos)

### Future Considerations
- **IDE Integration**: Consider adding Snyk VS Code extension for inline security feedback
- **GitHub App**: Evaluate Snyk GitHub App for automatic PR checks and fix PRs
- **Dependency Upgrade Automation**: Use Snyk fix PRs to automate dependency upgrades
- **Security Policy Evolution**: Regularly review and update `.snyk` ignore rules as vulnerabilities are fixed upstream
- **Enhanced Snyk Web UI Usage**: Leverage Snyk Web UI features like:
  - Security dashboards and executive reporting
  - Automated fix PRs for newly disclosed vulnerabilities
  - Integration alerts (email, Slack) for critical vulnerabilities
  - Historical trending and vulnerability/security health metrics

### Related ADRs
- **0015-sonarcloud.md**: SonarCloud integration for code quality (complementary to Snyk for security)
- **0011-bicep.md**: Bicep infrastructure-as-code (scanned by Snyk IaC)
- **0019-monorepo-turborepo.md**: Monorepo structure (supported by Snyk `--all-projects` flag)
- **0020-azure-devops-monorepo-pipeline.md**: CI/CD pipeline architecture (Snyk integration point)
