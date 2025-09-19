---
sidebar_position: 19
sidebar_label: 0018 Docusaurus Azure Pipeline Stages
description: "Split Docusaurus Azure Pipeline into separate build and deploy stages to prevent unwanted deployments from PRs."
status: accepted
date: 2025-01-08
deciders: development team
consulted: 
informed: team
---

# Split Docusaurus Azure Pipeline into Separate Build and Deploy Stages

## Context and Problem Statement

The CellixJS project uses Docusaurus for documentation hosting via GitHub Pages, with Azure Pipelines handling the CI/CD process. The previous single-stage pipeline configuration (`docusaurus/azure-pipelines.yml`) was executing both build and deployment operations on every commit, including pull requests. This resulted in unwanted deployments of documentation changes that hadn't been merged to the `main` branch yet, which violates CI/CD best practices and could potentially deploy incomplete or unreviewed documentation.

We needed a solution that would validate documentation builds on every PR while only deploying documentation after successful merge to `main`.

## Decision Drivers

- **Controlled Deployments**: Documentation should only be deployed after code review and merge to main branch
- **Build Validation**: Every PR should validate that documentation builds successfully
- **CI/CD Best Practices**: Separate build validation from deployment concerns
- **Artifact Efficiency**: Avoid redundant builds between stages
- **Consistency**: Align with existing multi-stage patterns used by API package pipeline

## Considered Options

- **Option 1**: Keep single-stage pipeline with conditional deployment logic
- **Option 2**: Split into multi-stage pipeline with build and deploy stages
- **Option 3**: Use separate pipeline files for build vs deploy

## Decision Outcome

Chosen option: **Split into multi-stage pipeline with build and deploy stages**, because it provides clean separation of concerns, follows Azure Pipelines best practices, and aligns with the existing multi-stage approach used by the API package pipeline.

### Consequences

- **Good**: PRs now only trigger builds, never deployments, preventing unwanted documentation updates
- **Good**: Build validation occurs on every PR commit, catching documentation build issues early
- **Good**: Deployments are controlled and only occur after successful merge to main
- **Good**: Efficient artifact handling eliminates redundant builds between stages
- **Good**: Consistent patterns across project pipelines improve maintainability
- **Neutral**: Slightly more complex pipeline configuration
- **Bad**: None identified

## Implementation Details

### Build Stage
- **Triggers**: Runs on both PR commits and main branch pushes
- **Actions**: 
  - `npm ci` to install dependencies
  - `npm run build` to build documentation
  - Publishes build artifacts for deployment stage
- **Purpose**: Validates that documentation builds successfully before allowing merge

### Deploy Stage 
- **Triggers**: Only runs on main branch pushes (includes condition: `and(succeeded(), ne(variables['Build.Reason'], 'PullRequest'))`)
- **Dependencies**: Requires successful build stage completion
- **Actions**: 
  - Downloads build artifacts from build stage
  - Restores artifacts to correct build directory
  - Runs `npm run deploy --skip-build` to deploy to GitHub Pages
- **Purpose**: Deploys documentation only after successful merge to main

### Key Technical Changes
- Converted from single job to multi-stage pipeline with `stages:` configuration
- Added `PublishBuildArtifacts@1` task to build stage for artifact sharing
- Added `DownloadBuildArtifacts@1` and artifact restoration logic to deploy stage
- Used `--skip-build` flag with Docusaurus deploy command to use pre-built artifacts
- Applied conditional deployment using `condition: and(succeeded(), ne(variables['Build.Reason'], 'PullRequest'))`

## Validation

Implementation can be validated by:
- Confirming that PR commits trigger only the build stage and do not deploy
- Verifying that main branch pushes trigger both build and deploy stages
- Ensuring that failed builds prevent deployment stage execution
- Testing that build artifacts are correctly shared between stages

## More Information

- Based on changes from ShareThrift project PR #131
- Follows the same multi-stage pattern established in the API package pipeline
- Uses Azure Pipelines artifact publishing/downloading for efficient stage communication
- Leverages Docusaurus `--skip-build` flag for deployment optimization
