# AGENTS.md Convention Implementation

This document describes the new AGENTS.md convention implementation for CellixJS, replacing the previous `*.instructions.md` files with comprehensive agent-focused instructions.

## Overview

The CellixJS repository now uses the AGENTS.md convention, which provides action-oriented, agent-focused instructions for AI development assistance. Each AGENTS.md file defines a specific agent responsible for particular aspects of the codebase.

## Agent Architecture

### Global Agents (`.github/`)

#### TypeScript Development Agent (`.github/AGENTS.md`)
- **Scope**: All TypeScript files (`**/*.ts`)
- **Responsibilities**: Code quality, architecture compliance, type safety
- **Key Capabilities**:
  - Enforces strict TypeScript typing and compilation standards
  - Validates architectural patterns and separation of concerns
  - Maintains consistent code formatting and documentation
  - Coordinates with other agents for cross-cutting concerns

#### UI Development Agent (`.github/ui/AGENTS.md`)
- **Scope**: All UI packages (`packages/ui-*/src/**/*`)
- **Responsibilities**: React components, design system, accessibility
- **Key Capabilities**:
  - Implements atomic design methodology (molecules, organisms)
  - Enforces container/presentational component patterns
  - Maintains Ant Design and Tailwind CSS consistency
  - Ensures accessibility and performance standards
  - Coordinates GraphQL integration in UI components

### Domain Agent (`packages/api-domain/AGENTS.md`)

#### Domain-Driven Design Agent
- **Scope**: Domain layer (`packages/api-domain/**/*.ts`)
- **Responsibilities**: DDD patterns, authorization, event-driven architecture
- **Key Capabilities**:
  - Implements bounded contexts and aggregate patterns
  - Enforces Passport/Visa authorization throughout domain
  - Coordinates domain and integration event publication
  - Maintains proper entity lifecycle and value object patterns
  - Ensures clean domain boundaries and separation

### Infrastructure Agents

#### API Azure Functions Agent (`packages/api/AGENTS.md`)
- **Scope**: Main API package (`packages/api/**/*.ts`)
- **Responsibilities**: Service orchestration, Azure Functions integration
- **Key Capabilities**:
  - Orchestrates service initialization through Cellix framework
  - Manages dependency injection and service registry patterns
  - Configures Azure Functions handlers and routing
  - Coordinates OpenTelemetry observability integration

#### GraphQL API Agent (`packages/api-graphql/AGENTS.md`)
- **Scope**: GraphQL package (`packages/api-graphql/**/*.ts`)
- **Responsibilities**: Apollo Server, schema design, domain integration
- **Key Capabilities**:
  - Implements Apollo Server v4 with Azure Functions
  - Maintains type-safe GraphQL schemas and resolvers
  - Integrates with domain services through unit of work patterns
  - Handles authentication, authorization, and error responses

#### Domain Seedwork Agent (`packages/cellix-domain-seedwork/AGENTS.md`)
- **Scope**: Framework foundations (`packages/cellix-domain-seedwork/**/*.ts`)
- **Responsibilities**: DDD infrastructure, base classes, framework abstractions
- **Key Capabilities**:
  - Provides foundational DDD base classes and interfaces
  - Implements generic type converters and patterns
  - Maintains framework-wide consistency and reusability
  - Supports domain agents with comprehensive abstractions

## Agent Interaction Patterns

### Coordination Points
- **TypeScript Agent** ensures code quality across all other agents
- **UI Agent** coordinates with GraphQL Agent for data patterns
- **Domain Agent** provides business logic for API and GraphQL agents
- **Infrastructure Agents** implement domain interfaces and patterns

### Decision Framework
Each agent includes:
- **Primary Responsibilities** - What the agent manages
- **Decision Framework** - When/how to apply patterns
- **Integration Points** - How to coordinate with other agents
- **Success Criteria** - How effectiveness is measured
- **Emergency Procedures** - What to do when things break

## Migration from Instructions

### What Changed
- **Language**: From "Here's how we do X" → "You are responsible for X"
- **Structure**: From documentation → Agent capabilities and directives
- **Actionability**: From informational → Prescriptive with clear boundaries
- **Consolidation**: 25 instruction files → 6 comprehensive agents

### Benefits
- **Clearer Responsibilities**: Each agent has specific scope and authority
- **Better Coordination**: Defined integration points between agents
- **Actionable Guidance**: Agents know what to do, when, and how
- **Reduced Redundancy**: Related instructions consolidated into coherent agents
- **Scalable Architecture**: Agent pattern supports growing complexity

## Usage Guidelines

### For AI Agents
- Each AGENTS.md file defines a specific domain of responsibility
- Follow the decision frameworks for consistent behavior
- Coordinate with other agents through defined integration points
- Prioritize agent success criteria in decision making

### For Developers
- Reference appropriate AGENTS.md for guidance in specific areas
- Understand agent boundaries to know which patterns apply
- Use agent coordination points for cross-cutting concerns
- Follow agent-defined standards for consistency

### For Code Reviews
- Validate changes align with relevant agent responsibilities
- Check that agent integration points are respected
- Ensure agent success criteria are maintained
- Verify agent decision frameworks were followed

## File Structure

```
.github/
├── AGENTS.md                           # TypeScript Development Agent
└── ui/
    └── AGENTS.md                       # UI Development Agent

packages/
├── api/
│   └── AGENTS.md                       # API Azure Functions Agent
├── api-domain/
│   └── AGENTS.md                       # Domain-Driven Design Agent
├── api-graphql/
│   └── AGENTS.md                       # GraphQL API Agent
└── cellix-domain-seedwork/
    └── AGENTS.md                       # Domain Seedwork Agent
```

## Maintenance

### Adding New Agents
- Create AGENTS.md file in appropriate location
- Define clear scope with `applyTo` frontmatter
- Include all required sections (responsibilities, patterns, integration)
- Update this documentation with new agent

### Modifying Existing Agents
- Maintain backward compatibility where possible
- Update coordination points with affected agents
- Test changes against agent success criteria
- Document breaking changes and migration paths

### Quality Assurance
- Each agent should have comprehensive coverage of its domain
- Integration points should be clearly defined and tested
- Decision frameworks should be actionable and unambiguous
- Success criteria should be measurable and achievable

---

*This AGENTS.md convention provides the foundation for consistent, high-quality AI-assisted development across the CellixJS monorepo.*