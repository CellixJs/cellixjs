# @cellix/command-router

Create a small command router for named command handlers.

## Usage

```ts
import { createCommandRouter } from '@cellix/command-router';

const router = createCommandRouter();
router.register('build-report', () => 'ok');
router.dispatch('build-report');
```

## Example

`createCommandRouter()` normalizes command names before lookup so callers can register predictable command keys.
