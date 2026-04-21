# Agent Workflow System

## Quick Start

```bash
# Standard invocation
gh copilot agent orchestrator "GOAL: <describe what you want done>. CONSTRAINTS: Do not commit any code."

# Example
gh copilot agent orchestrator "GOAL: Split the admin dashboard into two separate pages - user management and listing management. Extract the tab logic into separate page components. CONSTRAINTS: Do not commit any code."
```

## How It Works

The orchestrator follows a **fixed, enforced sequence**:

```
PLANNER → IMPLEMENTER(S) → REVIEWER → [FEEDBACK CYCLE] → DONE
```

### Phase State Machine

The preToolUse hook maintains a `phase` file in `.agents-work/current/` that controls
which agent delegations are allowed:

```
(empty) ──[planner]──→ planning ──[implementer]──→ implementing ──[reviewer]──→ reviewing
                                       ↑                                           │
                                       │                              [review.feedback?]
                                       │                                           │
                                  implementing ←──────── feedback ←────────────────┘
                                                            │
                                                       [reviewer]
                                                            │
                                                       final-review → DONE
```

### Enforcement Rules

| Rule | How Enforced |
|------|-------------|
| Planner runs first | Hook only allows planner when phase is empty or `planning` |
| Implementers need a plan | Hook checks `plan.md` exists before allowing implementer |
| Reviewer after implementation | Hook only allows reviewer when phase is `implementing` or `feedback` |
| One feedback cycle max | After `reviewing` → `feedback` → `final-review`, no more implementers |
| Git commit/push blocked | Hook denies any execute tool call containing `git commit` or `git push` |
| Between-phase non-agent tools blocked | After a phase completes, non-delegation tools are denied until the orchestrator delegates the next agent |

### What Does NOT Get Blocked

During an active subagent phase, non-agent tools needed by the running agent
(read, search, execute, edit, view, etc.) are allowed. Between phases, the hook
blocks non-delegation tools so the orchestrator must immediately delegate the next
agent. A small set of infrastructure reads for external temp files is also allowed
so the CLI can relay subagent output.

## Agents

| Agent | Role | Tools | Writes |
|-------|------|-------|--------|
| `orchestrator` | Coordinates workflow, delegates everything | agent | — |
| `planner` | Analyzes goal, creates task breakdown | read, edit, write, create, search, execute, web | plan.md |
| `implementer` | Implements code changes, validates own work | agent, read, edit, search, execute, web | (code files) |
| `reviewer` | Reviews all code changes once | read, search, execute | review.ok / review.feedback |
| `implementer-research` | Research helper for implementer | read, search, web | (none) |
| `security` | Security assessment | read, search, execute | security.ok / security.blocked |
| `validator` | Build/test verification (optional) | read, search, execute | (none) |

## State Files

All state lives in `.agents-work/current/`.

Gate-driving files used by `enforce-agent-workflow.sh`:

```
.agents-work/current/
├── phase              # Current workflow phase (planning/implementing/reviewing/feedback/final-review)
├── plan.md            # Task breakdown from planner (prerequisite for implementers)
├── implementer.done   # Implementer checkpoint that unlocks review
├── review.ok          # Review passed (written by reviewer)
└── review.feedback    # Review findings for feedback cycle (written by reviewer)
```

Informational files that are surfaced in status output but do not change the phase machine:

```
.agents-work/current/
├── security.ok        # Security review passed
├── security.blocked   # Security review requires action or decision
├── workflow.session   # Active workflow marker used across subagent sessions
└── session.started    # Session timestamp
```

## Troubleshooting

### Orchestrator stuck in a loop
Check the phase file: `cat .agents-work/current/phase`. If the phase is wrong for
the action being attempted, the hook denial message explains what's expected.

### Planner can't create plan.md
The planner needs the `edit` tool to create files. Verify its agent definition includes `edit`.

### Implementer denied — "plan.md does not exist"
The planner hasn't written plan.md yet. Check if the planner completed successfully.

### Reviewer denied — unexpected phase
The reviewer can only run when phase is `implementing` or `feedback`. If phase is
`planning`, implementers haven't run yet.

### "final review in progress" denial
The feedback cycle is complete. No more implementer spawns allowed. The orchestrator
should proceed to reporting.

### Agent delegation detection
Known agent names are derived from `.github/agents/*.agent.md`, so adding or renaming
an agent definition updates both the parser and the hook automatically.

The hook recognizes agent delegations via three methods (in priority order):
1. `toolName` matches a known agent name (e.g., `"planner"`, `"reviewer"`) — **authoritative**, overrides arg scanning
2. Structured arg field (`agent`, `agent_type`, `agentName`, `agent_name`, `agentId`, `subagent`, `customAgent`) matches an agent — **reliable**, checked before text
3. Earliest occurrence of agent name in full arg text — **last resort**, handles unstructured payloads

All matching is case-insensitive. When the CLI wraps delegations in a generic tool (like `"task"`), structured fields in Priority 2 ensure correct routing even when prompts mention multiple agents.

### Debug logging
Set `AGENT_WORKFLOW_DEBUG=1` to log raw payloads to `.agents-work/current/hook-debug.log`:
```bash
AGENT_WORKFLOW_DEBUG=1 gh copilot agent orchestrator "..."
```

### Stale state from previous session
If a previous run ended unexpectedly, request a reset before starting a fresh top-level session:
```bash
mkdir -p .agents-work/current
touch .agents-work/current/reset.requested
```

The next `sessionStart` hook clears the workflow state and removes `reset.requested`.

You can also force the same reset with an environment override:
```bash
AGENT_WORKFLOW_FORCE_RESET=1 gh copilot agent orchestrator "..."
```
