# @cellix/slugify Manifest

## Purpose

Provide a small, predictable slug generator for framework packages and adapters.

## Scope

String normalization, separator control, and safe slug output.

## Non-goals

This package does not attempt full i18n transliteration or moderation workflows.

## Public API shape

Expose `slugify` from the root entrypoint plus options that control the separator.

## Core concepts

Slugs should be stable, lowercase by default, and safe to use in URLs and keys.

## Package boundaries

Normalization helpers and regex details stay internal.

## Dependencies / relationships

This package can be reused by other `@cellix/*` packages that need stable identifiers.

## Testing strategy

Verify slug behavior through root-entrypoint tests that focus on observable output.

## Documentation obligations

Keep the manifest, README, and public-export TSDoc aligned as the contract evolves.

## Release-readiness standards

The public export must be documented, tested, and intentionally minimal before release.
