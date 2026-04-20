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
| Non-agent tools always pass | Read, search, execute, etc. are never blocked — only agent delegations are gated |

### What Does NOT Get Blocked

Unlike the previous version, non-agent tools (read, search, execute, edit, view, etc.)
are **never blocked**. Agents need full tool access to do their work. Only agent
**delegations** (spawning a new subagent) are gated by the phase machine.

## Agents

| Agent | Role | Tools | Writes |
|-------|------|-------|--------|
| `orchestrator` | Coordinates workflow, delegates everything | agent, read, execute | — |
| `planner` | Analyzes goal, creates task breakdown | read, edit, search, web | plan.md |
| `implementer` | Implements code changes, validates own work | agent, read, edit, search, execute, web | (code files) |
| `reviewer` | Reviews all code changes once | read, search, execute | review.ok / review.feedback |
| `implementer-research` | Research helper for implementer | read, search, web | (none) |
| `security` | Security assessment (optional) | read, search, execute | security.ok |
| `validator` | Build/test verification (optional) | read, search, execute | (none) |

## State Files

All state lives in `.agents-work/current/`:

```
.agents-work/current/
├── phase              # Current workflow phase (planning/implementing/reviewing/feedback/final-review)
├── plan.md            # Task breakdown from planner (prerequisite for implementers)
├── review.ok          # Review passed (written by reviewer)
├── review.feedback    # Review findings for feedback cycle (written by reviewer)
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
The hook recognizes agent delegations via three methods (in priority order):
1. `toolName` matches a known agent name (e.g., `"planner"`, `"reviewer"`) — **authoritative**, overrides arg scanning
2. Structured arg field (`agent`, `agent_type`, `agentName`, `name`, etc.) matches an agent — **reliable**, checked before text
3. Earliest occurrence of agent name in full arg text — **last resort**, handles unstructured payloads

All matching is case-insensitive. When the CLI wraps delegations in a generic tool (like `"task"`), structured fields in Priority 2 ensure correct routing even when prompts mention multiple agents.

### Debug logging
Set `AGENT_WORKFLOW_DEBUG=1` to log raw payloads to `.agents-work/current/hook-debug.log`:
```bash
AGENT_WORKFLOW_DEBUG=1 gh copilot agent orchestrator "..."
```

### Stale state from previous session
Clear state manually:
```bash
rm -f .agents-work/current/{phase,plan.md,review.ok,review.feedback,hook-debug.log}
```
