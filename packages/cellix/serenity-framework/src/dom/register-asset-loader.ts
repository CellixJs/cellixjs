/**
 * Registers the asset-loader ESM hooks so CSS/image imports resolve
 * without errors in Node.js.
 *
 * Use via NODE_OPTIONS:
 * `NODE_OPTIONS='--import @cellix/serenity-framework/dom/register-asset-loader'`.
 */
import { register } from 'node:module';

register(new URL('./asset-loader-hooks.js', import.meta.url).href, import.meta.url);
