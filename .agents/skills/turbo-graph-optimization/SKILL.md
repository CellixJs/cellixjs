---
name: turbo-graph-optimization
description: >
  General-purpose agent skill for optimizing Turborepo task graphs using `turbo query` GraphQL 
  introspection. Works with any Turborepo 2.9+ monorepo — discovers build targets, task types, and 
  dependencies dynamically at runtime. Fully autonomous workflow: invoke and the agent completes 
  end-to-end analysis, optimization, verification, and presents formatted before/after results. 
  No user prompts, no ambiguous steps. Flags changes that cannot be verified via static import 
  analysis for human review; continues with all other optimizations.
license: MIT
compatibility: Turborepo 2.9+
metadata:
  author: CellixJS Team
  version: "1.0"
  repository: https://github.com/CellixJs/cellixjs
allowed-tools: Bash(turbo:query) Bash(turbo:run) Bash(find) Bash(cat) Bash(grep) Read Write Glob Grep
---

# Turborepo Task Graph Optimization Skill

This skill automates the analysis and optimization of Turborepo task graphs to eliminate unnecessary 
transitive dependencies and improve build performance. The workflow is **fully autonomous** — once invoked, 
the agent discovers the repository structure, analyzes task dependencies, proposes optimizations, 
verifies changes, and presents results without user interaction.

## When to Use This Skill

Use this skill when:

- **Build slowdown**: The monorepo build is slower than expected and you want to identify unnecessary 
  transitive dependencies
- **New package added**: Adding a new workspace package may pull in unnecessary upstream tasks
- **Periodic hygiene**: Regular reviews to keep task graphs clean and optimized
- **Pre-release**: Before major releases, verify that build targets are optimally configured
- **Performance investigation**: Analyze task graph structure to understand dependency bloat
- **CI optimization**: Reduce build time in CI/CD pipelines by removing unnecessary transitive tasks

## Workflow Overview

The skill executes this fully autonomous workflow with no user interaction points:

```
discover targets → load schema → baseline capture → analyze → 
propose & apply → verify → after capture → formatted results output
```

### Step-by-Step Workflow

1. **Discover Build Targets** (Autonomous)
   - Introspect the repository using `turbo query ls` to identify all packages
   - Detect deployable application build targets by finding packages with the primary build task
   - Primary task detection strategy:
     - First, check for the `build` task (the standard Turborepo convention)
     - If not found, query the `turbo.json` configuration for task definitions and infer the primary 
       task from the `tasks` section ordering or documentation
     - As fallback, use the first task defined in a package's `package.json` scripts if it's 
       semantically a build task (contains keywords: `build`, `bundle`, `dist`)
   - Use workspace configuration to understand package structure
   - No user selection or confirmation — analyze all discovered targets

2. **Load GraphQL Schema** (Autonomous)
   - Execute `turbo query --schema` to retrieve the full GraphQL schema
   - Insert schema into agent context for analysis

3. **Capture Baseline** (Autonomous)
   - For each discovered build target, execute `turbo query` to fetch transitive dependencies
   - Group results by task type (dynamically determined from query results)
   - Record as **Before** snapshot with task counts per type

4. **Analyze Dependencies** (Autonomous)
   - Identify unnecessary transitive dependencies using these patterns:
     - Task types pulled in transitively that are not required for the target's build output
     - Overly broad `dependsOn` rules (e.g., `^build` pulling in the entire upstream tree)
     - Uncacheable tasks in the critical path (tasks with no `outputs` defined)
     - Diamond dependencies that inflate the effective task graph
   - Use static import analysis of downstream source code to verify that tasks are actually used

5. **Propose & Apply Optimizations** (Autonomous with Safety Flags)
   - For each optimization, verify safety by checking actual `import` statements in downstream source
   - **Apply safe changes directly** to the build configuration
   - **Flag changes that cannot be verified** through static import analysis:
     - Runtime-only dependencies
     - Dynamic imports or conditional requires
     - Removals that could silently break production build paths
   - Continue with all other optimizations — the workflow does not halt for flagged items
   - Document reasoning for each flagged item

6. **Verify Build** (Autonomous)
   - Detect the primary build task using the same strategy as Step 1 (look for `build`, infer from 
     `turbo.json`, or fallback to package scripts)
   - Execute `turbo run <primary-task>` where `<primary-task>` is the dynamically detected build task
   - Confirm the build succeeds with optimized graph
   - If build fails, halt and report the failure
   - If the primary task cannot be reliably determined, document the limitation and continue with 
     snapshot comparison only (defer verification to human review)

7. **Capture After State** (Autonomous)
   - Re-run the same queries from step 3 to capture **After** snapshot
   - Compare against baseline

8. **Present Results** (Autonomous)
   - Output formatted before/after comparison table with:
     - Task type breakdown
     - Before count, after count, delta (with percentage for total)
     - Summary of changes made
   - If items were flagged for human review, list them separately with reasons
   - This output is the final deliverable — no separate log file needed

## Design Principles

### Repo-Agnostic Discovery

The skill discovers everything dynamically — **no hardcoded package names, paths, task types, or CI 
platform references**:

- **Build targets**: Discovered via `turbo query ls` and workspace introspection
- **Package structure**: Determined from actual repo layout — not assumed to be `packages/` and `apps/`
- **Task types**: Discovered from query results — not assumed (e.g., not hardcoding `build`, 
  `type-check`, `typegen`)
- **CI coordination**: Skill notes that changes may affect CI change detection but does not reference 
  any specific platform

This means the skill works equally on any Turborepo 2.9+ monorepo, regardless of:
- Workspace layout (e.g., `packages/` and `apps/`, or custom structures)
- Naming conventions (e.g., scoped vs. non-scoped package names)
- Task naming (e.g., `build`, `dist`, `compile`, etc.)
- Organizational strategy (e.g., feature-based, layer-based, etc.)

### Autonomous by Default

No routine user prompts. If the agent encounters an ambiguous situation it can resolve safely:

- ✅ Makes reasonable choices and documents reasoning
- ✅ Continues with all other optimizations if some are risky
- ❌ Does NOT halt for routine decisions
- ❌ Does NOT ask "would you like me to proceed?"

**Exception — Critical Dependency Decisions**: If removal carries genuine risk that cannot be 
verified via static import analysis, the agent **flags that item** for human review rather than 
apply it. The workflow continues; only the specific risky change is deferred.

## Safety Verification

The skill never proposes removing a transitive dependency without:

1. **Static Import Analysis**: Check actual `import` / `require` statements in downstream source
2. **Output Verification**: Confirm the task's outputs are not consumed by the target
3. **Documentation**: If a removal cannot be verified, document why and flag it

### What Gets Flagged for Human Review

Examples of situations that cannot be verified via static import analysis:

- **Dynamic imports**: Code that uses `import()` with computed paths
- **Conditional requires**: `require(process.env.PLUGIN || 'default-plugin')`
- **Runtime plugins**: Tasks that load plugins at runtime without explicit imports
- **Side effects**: Tasks that must run for side effects (e.g., seeding databases) even if not 
  explicitly imported
- **Cross-cutting concerns**: Setup/teardown tasks that affect the entire build environment

These are listed in the final output with reason for deferral, and the rest of the optimizations 
continue.

## Output Format

### Standard Results (with optimizations found)

```
turbo query analysis on # transitive dependencies:

| Task Type              | Before | After | Δ         |
|------------------------|--------|-------|-----------| 
| Total tasks            | 97     | 59    | -38 (39%) |
| build                  | 58     | 59    | +1        |
| type-check             | 20     | 0     | -20       |
| typegen (uncacheable)  | 19     | 0     | -19       |

Summary: Removed type-check and typegen from the transitive dependency
graph. These tasks were pulled in via ^build in shared utility packages
but the target does not consume their outputs.
```

### No Optimizations Found

```
turbo query analysis on # transitive dependencies:

No unnecessary transitive dependencies found. Task graph is clean.
Total tasks: XX
```

### With Flagged Items for Human Review

```
turbo query analysis on # transitive dependencies:

| Task Type              | Before | After | Δ         |
|------------------------|--------|-------|-----------| 
| Total tasks            | 97     | 67    | -30 (31%) |
| (other tasks...)       | ...    | ...   | ...       |

Summary: Optimizations applied. See flagged items below for additional
review.

⚠ Flagged for review (not applied):

- #: depends on #codegen via dynamic require()
  → Cannot verify via static import analysis (src/plugins/loader.ts 
  loads plugins dynamically)

- #: setup task required for CI environment
  → May affect CI change detection if removed (check ADR-0020)
```

## Verification & Validation

The skill includes several validation checkpoints:

1. **Schema validation**: Verify `turbo query --schema` returns valid GraphQL schema
2. **Query execution**: Confirm queries return results before proceeding to analysis
3. **Build verification**: Run full build after changes to ensure success
4. **Snapshot comparison**: Verify before/after queries return valid results

If any critical step fails, the workflow halts and reports the failure.

## Turborepo 2.9+ Requirement

This skill requires **Turborepo 2.9 or later** because:

- `turbo query` became stable in Turborepo 2.9
- The GraphQL schema API provides structured task graph introspection
- Earlier versions use unstable or unavailable query endpoints

To check your Turborepo version:

```bash
turbo --version
```

If you have Turborepo < 2.9, upgrade:

```bash
pnpm add -D turbo@latest
```

## CI Coordination Notes

Task graph changes may affect CI change detection and build optimization. When updating 
`turbo.json` or task dependencies, be aware of:

- **Local Turborepo Cache**: Changes will affect remote caching behavior in CI/CD
- **Change Detection**: Updates to `dependsOn` may alter which packages are detected as changed
- **Build Time**: Removing unnecessary tasks should improve overall CI/CD pipeline time

Consult your project's CI/CD configuration and task graph documentation when making changes.

## Repo Patterns

The skill adapts to different monorepo structures. Example workspace layouts it supports:

**Flat structure**
```
packages/
  ├── ui/
  ├── api/
  ├── shared/
```

**Nested/scoped structure**
```
packages/
  ├── core/
  │   ├── domain/
  │   └── persistence/
  ├── apps/
  │   ├── api/
  │   └── web/
```

**Hybrid structure**
```
packages/scope1/component1/
packages/scope1/component2/
apps/app1/
apps/app2/
```

The skill discovers whatever structure exists via `turbo query ls` and analyzes accordingly. Task types and naming are inferred dynamically—no assumptions about `build`, `test`, `gen`, etc.

## Example Commands

The agent uses `turbo query` to introspect the repository structure. Here are common valid queries:

```bash
# Get the GraphQL schema to understand available fields
turbo query --schema

# List all packages in the repository
turbo query 'query { packages }'

# Get packages with their paths
turbo query 'query { 
  packages { 
    path 
    name 
    allDependencies { 
      path 
    } 
  } 
}'

# Query task information for a specific package
turbo query 'query {
  package(name: "@scope/package-name") {
    path
    name
  }
}'

# Detect primary build task (example for repos without 'build' task)
cat turbo.json | grep -A 10 '"tasks"'
cat package.json | grep -A 5 '"scripts"'

# Verify build with detected primary task
turbo run build        # if 'build' task exists
turbo run dist         # or alternative primary task if detected
turbo run compile      # or other task depending on repository

# Analyze task graph for a specific target
turbo run build --dry=json
```

The specific queries used are determined by the agent based on the repository's structure and the Turborepo `turbo query` GraphQL schema. The agent dynamically discovers available query fields and adapts accordingly.

## Common Optimization Patterns

The skill identifies and proposes these types of optimizations:

### 1. Removing Unused Task Types

**Pattern**: A task type is pulled in transitively but not used by the target

```
Before: Target depends on ^build → upstream has build, type-check, typegen
After: Target depends on ^build filtered to exclude type-check (uncacheable)

Result: -20 type-check tasks from transitive graph
```

### 2. Overly Broad Dependency Declarations

**Pattern**: `dependsOn: ["^build"]` pulls in all upstream builds, but only specific ones needed

```
Before: ^build pulls in 50+ upstream tasks
After: Explicit list of required tasks

Result: -30 tasks from critical path
```

### 3. Uncacheable Tasks in the Graph

**Pattern**: Tasks with no `outputs` cannot be cached and block downstream tasks unnecessarily

```
Before: typegen (uncacheable) in critical path
After: Remove from transitive deps or mark as optional

Result: -19 uncacheable tasks, faster builds
```

### 4. Diamond Dependencies

**Pattern**: Multiple paths to the same dependency inflate task count

```
Before: Package A → B → D, C → D (D counted twice)
After: Consolidate dependencies

Result: -15 duplicate tasks in graph
```

## Limitations & Caveats

- **Static Analysis Only**: Cannot detect truly dynamic dependencies (requires runtime analysis)
- **Output Matching**: Relies on tasks declaring their outputs correctly in `turbo.json`
- **Source Inspection**: Only checks explicit imports — cannot detect plugin loading or side effects
- **Build Variants**: Analysis assumes a single build configuration; multi-target builds may have 
  different optimization opportunities
- **Package.json Scripts**: Task discovery relies on Turborepo's introspection, not package.json scripts

## References

### Turborepo Documentation
- [Turborepo 2.9 Release](https://turborepo.dev/blog/2-9)
- [turbo query Documentation](https://turborepo.dev/docs/reference/query)
- [Task Graph Structure](https://turborepo.dev/docs/core-concepts/task-graph)
- [Skipping Tasks with turbo query affected](https://turborepo.dev/docs/guides/skipping-tasks)

### Inspiration & Reference Workflow
- [Anthony Shew's turbo query + agent workflow](https://x.com/anthonysheww/status/2039812921845502371)
  — Demonstrates the manual version of this workflow that the skill automates

