# SonarQube MCP Server Usage Guide

This document explains how to use the SonarQube MCP server integration with GitHub Copilot in the CellixJS repository.

## Overview

The SonarQube MCP server provides GitHub Copilot with read-only access to SonarCloud analysis data, enabling the agent to understand and resolve code quality issues directly in Pull Request workflows.

## Available Tools

### 1. Quality Gate Status
**Tool**: `sonarqube_quality_gate`

Gets the current quality gate status for the project or PR.

**Example Response**:
```json
{
  "status": "ERROR",
  "conditions": [
    {
      "status": "ERROR",
      "metricKey": "coverage",
      "comparator": "LT",
      "periodIndex": 1,
      "errorThreshold": "80",
      "actualValue": "75.5"
    }
  ]
}
```

### 2. Project Issues
**Tool**: `sonarqube_issues`

Gets issues from SonarCloud analysis with optional filtering.

**Parameters**:
- `severity`: Filter by severity (BLOCKER, CRITICAL, MAJOR, MINOR, INFO)
- `type`: Filter by type (BUG, VULNERABILITY, CODE_SMELL)

**Example Usage**:
- Get all critical issues: `{"severity": "CRITICAL"}`
- Get all bugs: `{"type": "BUG"}`
- Get critical vulnerabilities: `{"severity": "CRITICAL", "type": "VULNERABILITY"}`

**Example Response**:
```json
{
  "total": 3,
  "issues": [
    {
      "key": "AXrG8...",
      "rule": "typescript:S1481",
      "severity": "MINOR",
      "component": "simnova_cellix-data-access:packages/ocom/domain/src/contexts/user/user.ts",
      "line": 15,
      "message": "Remove this unused import of 'unused'.",
      "type": "CODE_SMELL",
      "status": "OPEN"
    }
  ]
}
```

### 3. Coverage Metrics
**Tool**: `sonarqube_coverage`

Gets code coverage metrics from SonarCloud.

**Example Response**:
```json
{
  "coverage": "75.5",
  "line_coverage": "80.2",
  "branch_coverage": "65.8",
  "lines_to_cover": "1000",
  "uncovered_lines": "245"
}
```

### 4. Analysis Report
**Tool**: `sonarqube_analysis_report`

Gets analysis results from the local `.scannerwork/report-task.txt` if available (useful after running `npm run sonar:pr`).

### 5. Server Information
**Tool**: `sonarqube_info`

Gets SonarQube MCP server configuration and context information.

**Example Response**:
```json
{
  "serverUrl": "https://sonarcloud.io",
  "organization": "simnova", 
  "projectKey": "simnova_cellix-data-access",
  "prContext": true,
  "prNumber": "123"
}
```

## Context Detection

The MCP server automatically detects PR context:

- **PR Context**: When running in a Pull Request workflow, the server can access PR-specific analysis data
- **General Context**: When not in a PR, provides project-level analysis data

## Environment Variables

The following environment variables are automatically configured:

- `SONAR_TOKEN`: Authentication token for SonarCloud API
- `SONAR_SERVER_URL`: SonarCloud server URL (https://sonarcloud.io)
- `SONAR_ORGANIZATION`: Organization name (simnova)
- `SONAR_PROJECT_KEY`: Project key (simnova_cellix-data-access)
- `PR_CONTEXT`: Whether running in PR context (true/false)
- `PR_NUMBER`: Pull request number (if in PR context)

## Common Copilot Use Cases

### 1. Quality Gate Resolution
Ask Copilot to check and resolve quality gate failures:
> "Check the SonarCloud quality gate status and help me resolve any issues"

### 2. Code Coverage Improvement
Ask Copilot to improve test coverage:
> "Check our current code coverage and suggest areas that need more testing"

### 3. Security Vulnerability Resolution
Ask Copilot to find and fix security issues:
> "Find all security vulnerabilities in the current PR and help me fix them"

### 4. Code Smell Cleanup
Ask Copilot to clean up code quality issues:
> "Show me all code smells in the current PR and help me refactor them"

## Limitations

- **Read-only access**: The MCP server can only read SonarCloud data, not modify it
- **PR-scoped**: Most effective when used in Pull Request workflows
- **Rate limits**: Subject to SonarCloud API rate limits
- **Token permissions**: Limited by the permissions of the provided SONAR_TOKEN