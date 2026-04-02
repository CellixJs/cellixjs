## Package framing

`@cellix/slugify` is a new package for creating predictable URL-safe slugs from display text. It is intentionally small and does not own transliteration for every language or content moderation rules.

## Consumer usage exploration

Consumers need a one-step way to turn labels into stable slugs for routes, cache keys, or filenames. They care about predictable lowercasing, separator handling, and stripping unsafe punctuation.

## Contract gate summary

- `slugify(input, options?)` is proposed as the primary public export for turning display text into stable URL-safe slugs.
- `SlugifyOptions` is proposed as the minimal public options type because consumers need to control separators without importing internals.

Primary success-path snippet:

```ts
const slug = slugify("Cellix Framework", { separator: "-" });
```

Human review was required because this is a new package and the initial public surface establishes the baseline contract. No extra helper exports were approved.

## Public contract

The package starts with a single root export, `slugify(input, options?)`, plus a small `SlugifyOptions` type. No helper exports are public.

## Test plan

Write failing root-entrypoint tests for separator normalization, trimming, repeated punctuation collapse, and empty-string handling before implementing the function.

## Changes made

Created the package with manifest, README, root entrypoint, public-contract tests, and implementation that emerged from those tests. Kept tokenization helpers private to the module.

## Documentation updates

Documented the package intent in `manifest.md`, added consumer usage examples to `README.md`, and added TSDoc for `slugify`.

## Release hardening notes

The export surface is intentionally minimal and release-ready for early adopters. This is a new package, so the semver risk is low, but future work may need locale-specific hooks before wider adoption.

## Validation performed

Validated the root-entrypoint contract with targeted Vitest cases and confirmed that the README and manifest both describe the same single-export package.
