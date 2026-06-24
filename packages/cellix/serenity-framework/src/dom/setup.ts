/**
 * DOM environment bootstrap for component-level acceptance tests.
 *
 * Registers a complete set of browser globals — `window`, `document`,
 * `navigator`, the DOM constructor classes, and modern layout APIs such as
 * `matchMedia`, `ResizeObserver`, and `IntersectionObserver` — onto the Node
 * global object via
 * {@link https://github.com/capricorn86/happy-dom | happy-dom}'s global
 * registrator.
 *
 * happy-dom implements the layout/visual APIs that Ant Design and React Router
 * touch at import or render time, so unlike jsdom this setup needs no manual
 * polyfills.
 *
 * Load this module for its side effects before any module that imports
 * `react-dom`, so React binds its event system to the happy-dom environment.
 * Prefer a Node `--import` preload, which is order-independent:
 *
 * ```sh
 * NODE_OPTIONS='--import @cellix/serenity-framework/dom/setup' cucumber-js
 * ```
 *
 * @packageDocumentation
 */

import { GlobalRegistrator } from '@happy-dom/global-registrator';

GlobalRegistrator.register({ url: 'http://localhost:3000' });
