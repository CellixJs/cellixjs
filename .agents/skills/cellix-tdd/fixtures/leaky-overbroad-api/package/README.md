# @cellix/http-headers

Merge case-insensitive header maps without exposing normalization internals.

## Usage

```ts
import { mergeHeaders } from '@cellix/http-headers';

mergeHeaders({ Accept: 'application/json' }, { accept: 'text/plain' });
```

## Example

`mergeHeaders()` keeps the last value for a header name after normalizing the name shape.
