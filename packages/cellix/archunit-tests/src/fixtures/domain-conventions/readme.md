# Domain Conventions Fixtures

These fixture files are used to test the member-ordering rule:

- `instance-mixed-ok.ts` — Valid: instance methods and accessors can be interleaved
- `static-instance-misordered.ts` — Invalid: static members must come before instance members
