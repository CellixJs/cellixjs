# @cellix/retry-policy

Create deterministic retry schedules without exposing backoff internals.

## Usage

```ts
import { createRetryPolicy } from '@cellix/retry-policy';

const policy = createRetryPolicy({ attempts: 3, baseDelayMs: 100 });
policy.delays;
```

## Example

`createRetryPolicy()` returns a policy object with a bounded list of delays that callers can use to schedule retries.
