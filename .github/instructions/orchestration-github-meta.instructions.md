---
applyTo: ".github/**/*"
description: Orchestration guidance for repository-level Copilot instructions, custom agents, and GitHub-facing AI assets.
---

# GitHub Meta Orchestration

- Treat `.github/**/*` as `tooling` work unless the change is purely documentation.
- Repository-wide guidance belongs in `.github/copilot-instructions.md`; path-specific guidance belongs under `.github/instructions/`.
- Custom agents live in `.github/agents/*.agent.md` and should remain thin, role-focused, and state-machine-aware.
- Agent profiles should use YAML frontmatter and Markdown instructions consistent with GitHub's custom-agent configuration model.
