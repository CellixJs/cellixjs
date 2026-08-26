import parseHtml from 'html-react-parser';
import type { ReactNode } from 'react';

// The ESM runtime default export of `html-react-parser` is always a callable
// function. tsgo resolves the package's CJS type entry (whose default is typed
// as the module namespace) on clean builds, so we assert the runtime signature
// here to keep a single, faithful `parse(html)` call site everywhere else.
const parse = parseHtml as unknown as (html: string) => ReactNode;

export default parse;
