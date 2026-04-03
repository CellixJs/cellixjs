# Cellix TDD Summary

Package: `{{PACKAGE_NAME}}`

Package path: `{{PACKAGE_PATH}}`

Summary path: `{{SUMMARY_PATH}}`

## Package framing

TODO: replace this section with the package purpose, intended consumers, and whether this is a feature, refactor, greenfield package, docs-alignment task, or API-surface reduction.

## Consumer usage exploration

TODO: replace this section with realistic consumer flows, important success paths, and the edge or failure cases that shaped the contract.

## Contract gate summary

TODO: replace this section with the proposed public exports and their purpose, the primary consumer success-path snippet, any uncertain exports, and whether human review was required before finalizing the contract.

## Public contract

TODO: replace this section with the intended public exports, the observable behavior consumers should rely on, and anything that must remain internal.

## Test plan

TODO: replace this section with the failing or preserved public-contract tests, grouped by exported member, including the public entrypoints used, the main success, failure, and branch-driving scenarios covered, and how duplicate narrower tests were avoided or justified.

## Changes made

TODO: replace this section with the implementation or refactor work that emerged from the contract tests.

## Documentation updates

TODO: replace this section with how `manifest.md`, `README.md`, and rich TSDoc were reviewed or updated to match the contract, including standalone consumer framing and usage examples where relevant.

## Release hardening notes

TODO: replace this section with export-surface review, semver or compatibility impact, and any remaining release risks, blockers, or follow-up work.

## Validation performed

TODO: replace this section with the concrete verification steps you ran and the result, including commands for the package build, the existing package test suite, any wider dependent or monorepo verification, any public behaviors that were intentionally left unverified, and any narrower tests that were intentionally retained beyond the public contract suite.
