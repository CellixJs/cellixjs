/**
 * Registers the asset-loader ESM hooks so CSS/image imports resolve
 * without errors in Node.js.
 *
 * Use via NODE_OPTIONS: `NODE_OPTIONS='--import ./src/shared/support/ui/register-asset-loader.ts'`
 * or by adding `--import` to the cucumber-js invocation.
 */
import { register } from 'node:module';

register(new URL('./asset-loader-hooks.mjs', import.meta.url).href, import.meta.url);
