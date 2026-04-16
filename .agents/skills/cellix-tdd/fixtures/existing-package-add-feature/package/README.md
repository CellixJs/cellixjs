# @cellix/query-params

Helpers for parsing query-string values into small, predictable primitives.

## Usage

```ts
import { parseBooleanFlag, parseStringList } from '@cellix/query-params';

const preview = parseBooleanFlag(searchParams.get('preview'));
const tags = parseStringList(searchParams.get('tags'));
```

## Example

`parseBooleanFlag()` accepts `true`, `false`, `1`, `0`, `yes`, and `no`. Invalid text throws a `TypeError`.
