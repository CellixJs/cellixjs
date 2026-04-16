# @cellix/slugify

Create stable, URL-safe slugs from display text.

## Usage

```ts
import { slugify } from '@cellix/slugify';

slugify('Hello, CellixJS!');
slugify('Hello, CellixJS!', { separator: '_' });
```

## Example

`slugify()` lowercases text, collapses punctuation into separators, trims duplicate separators, and returns a predictable slug.
