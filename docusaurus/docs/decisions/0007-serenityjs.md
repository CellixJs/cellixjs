---
sidebar_position: 7
sidebar_label: 0007 SerenityJS
description: "Use SerenityJS to create business-focused test scenarios, automate acceptance criteria, test domain layer, and generate living documentation."
# These are optional elements. Feel free to remove any of them.
status: proposed
contact: nguyenduy
date: 2024-04-22
deciders: nguyenduy, ikeem07
consulted: gidich, mgupta83
informed: etang93, heruwala, anil
---

# Use SerenityJS to ensure delivering right features

## Context and Problem Statement

When developing a project, it is essential:

- To ensure that the features being developed are what the business wants.
- To capture all the business requirements and expectations in one place as a contract (living documentation) that can be easily accessed and understood by all stakeholders and team members.
- To have automated acceptance tests based on the living documentation that ensure the project's features are thoroughly tested.
- To test the domain layer and application layer (that captures the objects and business logic/rules in the system) to ensure that the business logic/rules are correctly implemented.
- To be able to identify and fix issues quickly and efficiently when making changes to the codebase.

## Decision Drivers

- **Business Focus**: Ensure that the project's features align with the business requirements and expectations.
- **Timely Feedback**: Provide timely feedback to the development team and business stakeholders on the project's progress and quality.
- **Keep track of the project's features**: Document the project's features in a way that is understandable and accessible to all stakeholders and team members.
- **Domain Layer Testing**: Test the domain layer to ensure that the business logic/rules are correctly implemented.
- **Living Documentation**: Generate living documentation that is always up-to-date and reflects the current state of the project's features.
- **Automated Testing**: Automate acceptance tests based on the living documentation to ensure that the project's features are tested thoroughly.
- **Efficient Issue Identification and Fixing**: Identify and fix issues quickly and efficiently when changes are made in the codebase.

## Considered Options

**Option #1: Use SerenityJS**

SerenityJS with the popular Screenplay pattern provides a high-quality, user-centered approach in automating acceptance tests, testing the domain layer, and generating living documentation. It provides a business-readable DSL (Domain-Specific Language) that can be understood by both developers and business stakeholders.

## Decision Outcome

Chosen option: **Option #1: Use SerenityJS**

## Pros and Cons of the Options

Pros of SerenityJS:

- **Free and open-source**: SerenityJS is free and open-source, making it accessible to all teams.

- **Screenplay pattern**: SerenityJS uses the Screenplay pattern, which provides a high-quality, user-centered approach to automating acceptance tests.

  - **Actor**: Represents the user or system interacting with the application and plays a role in a test scenario.
    
    Implementation in code: `data-access/screenplay/actors.ts`

  - **Ability**: Represents the user's or system's ability to perform certain actions.

    Implementation in code: `/data-access/screenplay/abilities`
    
  - **Interaction**: Represents an interaction between the user or system and the application.

    Implementation in code: `data-access/screenplay/interactions`
  - **Task**: Represents a user's or system's action in a test scenario. A task is a sequence of activities that the user or system performs and is reusable to assemble test scenarios.

    Implementation in code: `data-access/screenplay/interactions`
  - **Question**: Represents a query that the user or system asks the application to verify the application's state.

    Implementation in code: `screenplay/questions`

- **Business-focused test scenarios**: SerenityJS allows for the creation of business-focused test scenarios that can be understood by both developers and business stakeholders.

- **Automated acceptance tests**: SerenityJS enables the automation of acceptance tests, ensuring that the project's features are thoroughly tested.

- **Domain layer testing**: SerenityJS allows for the testing of the domain layer, ensuring that the business logic/rules are correctly implemented.

- **Living documentation**: SerenityJS generates living documentation that is always up-to-date and reflects the current state of the project's features.

Cons of SerenityJS:

- **Learning curve**: SerenityJS may have a learning curve for team members who are new to the tool.

- **Complexity**: SerenityJS may introduce additional complexity to the project, especially when defining test scenarios and maintaining the living documentation.

- **Maintenance**: SerenityJS may require additional maintenance to keep the test scenarios and living documentation up-to-date.

## Links

- [SerenityJS](https://serenity-js.org/)
- [Screenplay Pattern](https://serenity-js.org/handbook/design/screenplay-pattern/)