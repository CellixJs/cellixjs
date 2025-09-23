---
sidebar_position: 12
sidebar_label: 0012 Linter Oxlint vs Biome
description: "Decision record for selecting a linter: Oxlint vs Biome."
status: accepted
contact: nnoce14 etang93
date: 2025-06-27
deciders: gidich etang93 mgupta83 nnoce14 iwilson dheruwala
consulted: gidich etang93 mgupta83 nnoce14 iwilson dheruwala
informed: gidich etang93 mgupta83 nnoce14 iwilson dheruwala
commit: https://github.com/gidich/cellixjs/commit/d8d1d99b558bbab39fd769731d1f5a7ccaa1003e
---

# Select a Linter: Oxlint vs Biome

## Context and Problem Statement

The project requires a fast, reliable, and modern linter for TypeScript and JavaScript codebases. In addition to standard linting, we are specifically seeking a solution that provides type safety aware rules and robust code formatting capabilities. Our goal is to streamline the various aspects of code quality—linting, type checking, and formatting—into a cohesive workflow that minimizes external dependencies and reduces the need for unnecessary packages. We are evaluating two options—Oxlint and Biome—to determine which best fits our needs for code quality, performance, ecosystem compatibility, maintainability, and the ability to consolidate tooling. The decision should be documented in a standardized and thorough way to ensure transparency and future reference.

While ESLint remains the default in most JavaScript/TypeScript projects, it was excluded from this decision because its performance, reliance on a plugin-heavy ecosystem, and fragmented formatting integration (via Prettier) are misaligned with our goals of minimal tooling, unified configuration, and a streamlined experience for both developers (DX) and AI agents (AIX).

## Decision Drivers

- Performance and speed of linting large codebases
- Quality and accuracy of linting rules
- Ecosystem compatibility (TypeScript, JavaScript, formatting, etc.)
- Integration with existing tools and CI/CD pipelines
- Ability to consolidate tooling
- Community support and long-term maintenance
- Customizability and extensibility

## Considered Options

- [Oxlint](https://oxc.rs/docs/guide/usage/linter.html): A fast Rust-based linter from the [oxc](https://oxc.rs/) ecosystem with partial TypeScript support.
- [Biome](https://biomejs.dev/): A full-toolchain successor to [Rome](https://biomejs.dev/blog/announcing-biome/) with lint + format + TypeScript awareness.

## Decision Outcome

Chosen option: **Biome**

We have decided to use Biome as our linter. Biome provides built-in support for features we value, such as **type-aware linting** and **integrated code formatting**, which Oxlint was unable to provide. In our evaluation, Biome also outperformed Oxlint in terms of performance (see *Validation* below for timing details). Additionally, since Biome offers all required functionality in a single package, we are able to reduce the number of external dependencies in our codebase, simplifying our tooling and maintenance. Biome also supports linting and formatting for a [broader range of languages](https://biomejs.dev/internals/language-support/) (such as JSON and GraphQL), whereas Oxlint [language support](https://oxc.rs/docs/guide/usage/linter.html#language-support) is mostly constrained to the Node.js ecosystem. Furthermore, Oxlint’s lack of type-aware linting and reliance on ESLint negates much of its performance advantage. These factors made Biome the clear choice for our project.

### Consequences

- Good: The selected linter (Biome) will improve code quality, consistency, and developer experience, while reducing external dependencies and streamlining our workflow.
- Bad: Adopting a newer, less mature linter instead of stable ESLint may result in unexpected behavior or missing functionality.  
    For example, Biome currently lacks support for **nested or overridable configurations**, limiting flexibility in monorepos or multi-package projects.

## Validation


Timings were collected by running `time npm run lint` three times on each branch (*main*, *oxlint*, *biome*) and averaging the results. All tests were performed on the same machine and codebase.

**All times are listed in seconds.**

| Trial      | ESLint (main) | Oxlint (oxlint branch) | Biome (biome branch) |
|------------|---------------|-----------------------|----------------------|
| Trial 1    |    33.602     |        12.399         |        2.229         |
| Trial 2    |    33.632     |        12.598         |        1.837         |
| Trial 3    |    33.526     |        12.440         |        1.824         |
| **Average**|    33.587     |        12.479         |        1.963         |

*Winner* - **Biome** took only **1.963 seconds** on average to lint + format the entire codebase

## Pros and Cons of the Options

### Oxlint

- Good, because it is written in Rust and offers high performance.
- Good, because it provides modern linting rules and supports TypeScript and JavaScript.
- Good, because it enables nested configurations where packages can override rules as needed.
- Neutral, because its ecosystem and plugin support are still growing.
- Bad, because it lacks [type-safety linting](https://oxc.rs/docs/guide/usage/linter.html#language-support), requiring the extra dependency on ESLint for *typescript-eslint* plugin.
- Bad, because running it in conjunction with ESLint reduces the performance benefits Oxlint offers.
- Bad, because it lacks built-in formatting support, requiring an additional dependency on Prettier via [@prettier/plugin-oxc](https://oxc.rs/docs/guide/usage/formatter.html).

### Biome

- Good, because it is a successor to Rome and aims to be an all-in-one tool (linting, formatting, etc.).
- Good, because it has a growing community and aims for high performance.
- Good, because it supports both type-aware linting and formatting out of the box, breaking the dependencies on ESLint and Prettier.
- Neutral, because it is still evolving and some features may be experimental.
- Bad, because migration from existing tools may require additional configuration or adaptation.
- Bad, because nested configurations are currently not supported. ([Github Issue](https://github.com/biomejs/biome/issues/6509#issuecomment-3005923200))

## More Information

It is worth noting that Oxc is actively working on their own formatter as an alternative to Prettier ([oxc-formatter](https://github.com/oxc-project/oxc/tree/main/crates/oxc_formatter)). Once this package becomes publicly available, it may warrant revisiting this decision to evaluate whether Oxlint can provide a more unified solution.

Currently, Biome does not support nested or overridable configurations, which may limit flexibility for complex monorepos or projects with varying linting requirements. However, the team chose Biome due to its streamlined workflow—offering linting, type safety, and code formatting from a single source—while also delivering a significant performance boost compared to alternatives. This trade-off was considered acceptable given the benefits to developer experience and maintainability. 

However, the team should be aware that the community has discovered [workarounds](https://gist.github.com/shirakaba/83f456566231580d525169236a350e73) that enabled similar functionality in the previous version of Biome v1, so there is good reason to suggest it will be supported by the community eventually for Biome v2. The lack of support for nested configurations in Biome has been raised [multiple times](https://github.com/biomejs/biome/issues/1867) by the community, but as of now, the Biome team has not prioritized this feature. We will continue to monitor community discussions and Biome’s roadmap for any changes in this area.

> For ongoing reference, the team can track the relative adoption and popularity of both tools using [npm trends](https://npmtrends.com/@biomejs/biome-vs-oxlint)
