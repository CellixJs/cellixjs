# Ambiguous Flat Tests

Harden an existing `@cellix/*` package that already has root-only exports and public documentation, but whose tests are flat and do not make it obvious which exported member is under test.

The skill should preserve public-entrypoint-only testing while restructuring the suite so each exported member is clearly identified.
