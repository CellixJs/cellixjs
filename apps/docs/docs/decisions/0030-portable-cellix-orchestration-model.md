---
sidebar_position: 30
sidebar_label: 0030 Portable Cellix Orchestration
description: "Adopt a portable, profile-driven orchestration control plane for Cellix-based repositories."
status: accepted
contact: github-codex
date: 2026-04-15
deciders: nnoce14 github-codex
consulted: development-team
informed: all-developers
---

# Adopt a Portable, Profile-Driven Orchestration Control Plane for Cellix Repositories

## Context and Problem Statement

CellixJS now uses multiple instruction layers, reusable skills, repo-local conventions, and AI-agent execution patterns. Without a governing control plane, the workflow can drift into implicit behavior spread across ADRs, instructions, skills, custom agents, hooks, and runtime notes.

We need a versioned orchestration system that keeps the delivery protocol primary and role prompts secondary. The same orchestration core must stay viable for the current mixed CellixJS monorepo, a future framework-only Cellix repository, and future application-only consumer repositories.

## Decision Drivers

- **Portable orchestration core**: one orchestration model should work across mixed, framework-only, and application-only repositories
- **Convention-first adoption**: downstream repos should declare only profile and path/package mappings unless they intentionally deviate
- **Explicit workflow control**: states, transitions, role validity, escalation, and completion expectations must be formalized
- **Separation of policy and execution**: specs and ADRs define policy; skills, agents, hooks, and runtime artifacts execute or enforce it
- **Framework extensibility without global coupling**: `cellix-tdd` must remain a framework-only extension, not a mandatory global workflow
- **Minimal default artifact depth**: trivial tasks should not produce heavyweight runtime paperwork

## Considered Options

- Keep the workflow implicit across instructions, skills, prompts, and hooks
- Create a heavy per-repo orchestration manifest that enumerates every lane, agent, and hook
- Adopt a lightweight, profile-driven orchestration spec backed by a shared model

## Decision Outcome

Chosen option: "Adopt a lightweight, profile-driven orchestration spec backed by a shared model", because it gives Cellix a stable control plane without forcing every repository to hand-maintain a large policy manifest.

The orchestration system is defined by two machine-readable artifacts:

1. `orchestration.spec.yaml`
   This is the repo-local contract. It records the orchestration version, selects a repo capability profile, maps concrete paths/packages into abstract classes, and optionally declares narrow overrides.
2. `.agents/orchestration/model/orchestration-model.v1.json`
   This is the shared orchestration model. It defines capability profiles, lane families, lanes, workflow states, valid transitions, role allowlists, artifact posture, completion gates, and extension points such as `cellix-tdd`.

### Consequences

- Good, because repository adoption remains small and convention-first
- Good, because the orchestration state model is explicit and enforceable instead of prompt-only
- Good, because framework-oriented behavior can be activated only where the selected profile and lane support it
- Good, because application-only repos can omit framework behavior without redesigning the core
- Neutral, because some control-plane metadata now lives in JSON and YAML rather than prose alone
- Bad, because the orchestration system itself becomes product code that must be validated and maintained
- Bad, because the repo must keep the orchestration model, instructions, skills, agents, hooks, and docs aligned as the system evolves

## Validation

This decision is validated through the orchestration artifacts introduced with issue `#218`:

1. The repo-local `orchestration.spec.yaml` selects the `mixed-framework-and-app` profile for CellixJS.
2. Example specs prove that the same orchestration core also fits `framework-only` and `application-only` repositories.
3. The shared model formalizes lane families, workflow states, transition rules, authority order, artifact posture, and framework extensions in a machine-readable file.
4. Follow-up validator and hook work can consume the same control-plane artifacts instead of re-encoding orchestration logic from prose.

## Pros and Cons of the Options

### Keep the workflow implicit across instructions, skills, prompts, and hooks

- Good, because it avoids introducing a new control-plane artifact
- Good, because individual components can evolve independently in the short term
- Bad, because policy drifts into multiple layers with no governing source of truth
- Bad, because role validity, transition rules, and extension boundaries remain easy to violate
- Bad, because consumer repositories would have no clear adoption contract

### Create a heavy per-repo orchestration manifest that enumerates every lane, agent, and hook

- Good, because every repo would have an explicit local inventory
- Neutral, because validators could read everything from one file
- Bad, because consumer repositories would have to duplicate profile defaults unnecessarily
- Bad, because the manifest would become bloated and hard to maintain
- Bad, because portability would depend on copying a large policy surface into every repository

### Adopt a lightweight, profile-driven orchestration spec backed by a shared model

- Good, because repos only declare version, profile, path/package classes, and optional overrides
- Good, because profile defaults can expose the right lane families and extension points automatically
- Good, because the same control plane supports mixed, framework-only, and application-only topologies
- Good, because validators and hooks can target shared machine-readable rules
- Neutral, because repos still need to choose good class mappings for their structure
- Bad, because the shared model must evolve carefully to avoid breaking existing repos

## More Information

### Authority order

The orchestration system uses this authority order:

1. orchestration spec
2. ADR or architecture-policy intent
3. repo-wide and path-scoped instructions
4. skills
5. thin role agents
6. runtime artifacts

Hooks enforce the control plane, but they do not invent policy beyond those layers.

### Capability profiles

The shared model defines these repository profiles:

- `mixed-framework-and-app`
- `framework-only`
- `application-only`

Each profile enables a coherent set of lane families rather than forcing repos to enumerate them manually.

### Abstract path/package classes

The control plane reasons about path/package classes instead of hardcoded namespace names:

- `reusableFramework`
- `applicationPackages`
- `tooling`
- `docs`

This keeps the orchestration core portable even when future repos have different package names or directory layouts.

### Workflow lanes

The initial lane model is:

- `reusable-framework-public-surface`
- `reusable-framework-internal`
- `application-feature-delivery`
- `tooling-workflow`
- `docs-architecture-planning`

### Workflow state machine

The explicit state model is:

- `initialized`
- `planning`
- `plan-complete`
- `implementing`
- `reviewing`
- `revising`
- `blocked`
- `done`

Valid transitions and role allowlists are defined in `.agents/orchestration/model/orchestration-model.v1.json`.

### Artifact posture

The default artifact posture is minimal:

- `intake.md`
- `plan.md`
- `final-summary.md`

Richer artifacts are allowed only when profile defaults, task risk, or parallel complexity justify them.

### Framework-oriented extension point

`cellix-tdd` is a profile- and lane-scoped extension point:

- available in `mixed-framework-and-app`
- available in `framework-only`
- unavailable in `application-only`
- activated only for reusable framework lanes

### ADR numbering note

Issue `#219` asked for "ADR-0025", but by April 15, 2026 the repository already contained ADRs through `0029`, including an existing `0025`. The orchestration decision is therefore recorded as ADR `0030`, which is the next available identifier in the repo.
