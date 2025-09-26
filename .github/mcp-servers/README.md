# MCP Servers Directory

This directory contains Model Context Protocol (MCP) servers that provide enhanced capabilities to the GitHub Copilot agent environment.

## SonarQube MCP Server

The SonarQube MCP server provides read-only access to SonarCloud analysis data, quality gates, and issue details to help the copilot agent understand and resolve code quality issues in Pull Requests.

### Features

- Fetch quality gate status for PRs
- Retrieve detailed issue lists with locations and descriptions
- Access coverage information
- PR-scoped analysis data
- Read-only access using existing SONAR_TOKEN

### Usage

The MCP server is automatically configured and started when the copilot environment is set up for PR workflows.