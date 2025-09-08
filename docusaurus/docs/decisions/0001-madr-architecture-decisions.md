---
sidebar_position: 1
sidebar_label: 0001 MADR Architecture Decisions
description: "Use Markdown Any Decision Records (MADR) to track Architectural Decisions."
# These are optional elements. Feel free to remove them if you don't need them.
status: accepted
date: 2024-04-12
deciders: dhaval, chara
consulted: patrick
informed:
---

# Use Markdown Any Decision Records (MADR) to track Architectural Decisions

## Context and Problem Statement

As the Owner Community project evolves, maintaining architectural consistency becomes crucial. With a Node.js backend and a TypeScript React frontend, documenting and managing architectural decisions pose challenges. We must ensure alignment among team members and community contributors to avoid confusion and inconsistency. Therefore, an efficient framework is needed to document, evaluate, and communicate decisions, fostering transparency and collaboration.

MADR is a lean template to capture any decisions in a structured way. The template originated from capturing architectural decisions and developed to a template allowing to capture any decisions taken.
For more information [see](https://adr.github.io/)

## Decision Drivers

- **Consistency**: Ensure consistency in documenting architectural decisions.
- **Transparency**: Architecture changes and associated decisions should be visible and accessible to the community.
- **Discoverability**: Ensure that architectural decisions are easily discoverable and comprehensible by storing decision records in the repository for teams involved in various language ports.

## Considered Options

* [MADR](https://adr.github.io/madr/) 3.0.0 – The Markdown Any Decision Records
* [Microsoft sementic-kernel](https://github.com/microsoft/semantic-kernel/tree/main/docs/decisions) - Microsoft's MADR implementation
* [forem](https://github.com/forem/forem-docs) - Forem's ADR implementation

## Decision Outcome

Chosen option: Use MADR format and store decision documents in the repository.

## Pros and Cons of the Options

### Use MADR format and store decision documents in the repository

How would we use ADR's to track technical decisions?

1. Copy docs/decisions/adr-template.md to docs/decisions/NNNN-title-with-dashes.md, where NNNN indicates the next number in sequence.
   1. Check for existing PR's to make sure you use the correct sequence number.
   2. There is also a short form template docs/decisions/adr-short-template.md
2. Edit NNNN-title-with-dashes.md.
   1. Status must initially be `proposed`
   2. List of `deciders` must include the aliases of the people who will sign off on the decision.
   3. The relevant EM and `patrick` must be listed as deciders or informed of all decisions.
   4. You should list the aliases of all partners who were consulted as part of the decision.
3. For each option list the good, neutral and bad aspects of each considered alternative.
   1. Detailed investigations can be included in the `More Information` section inline or as links to external documents.
4. Share your PR with the deciders and other interested parties.
   1. Deciders must be listed as required reviewers.
   2. The status must be updated to `accepted` once a decision is agreed and the date must also be updated.
   3. Approval of the decision is captured using PR approval.
5. Decisions can be changed later and superseded by a new ADR. In this case it is useful to record any negative outcomes in the original ADR.

#### Pros:

- Lightweight format: MADR provides a simple and easy-to-edit template for documenting architectural decisions.
- Git review process: Utilizing the standard Git review process for commenting and approval ensures transparency and collaboration.
- Community visibility: Decisions and the review process are transparent to the community, fostering openness and participation.

#### Cons:

- None identified.

<!-- This is an optional element. Feel free to remove. -->

## More Information

- Reference: [MADR](https://github.com/microsoft/semantic-kernel/blob/main/docs/decisions/0001-madr-architecture-decisions.md)