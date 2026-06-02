/**
 * ESM loader hooks that intercept CSS, image, and other non-JS imports so
 * they resolve to empty modules instead of throwing in Node.js.
 *
 * Usage: `NODE_OPTIONS='--import @cellix/serenity-framework/jsdom/register-asset-loader' cucumber-js`
 */

const ASSET_RE = /\.(css|less|scss|sass|svg|png|jpe?g|gif|webp|woff2?|ttf|eot|ico)$/i;

/** Minimal loader context needed by the asset hook. */
export interface AssetLoaderResolveContext {
	/** URL of the module importing the asset, supplied by Node's loader API. */
	parentURL?: string;
}

/** Result returned by Node's ESM resolve hook. */
export interface AssetLoaderResolveResult {
	/** Whether the loader chain should stop at this result. */
	shortCircuit?: boolean;

	/** Resolved module URL. */
	url: string;
}

/** Next resolver supplied by Node's ESM loader chain. */
export type NextAssetLoaderResolve = (specifier: string, context: AssetLoaderResolveContext) => Promise<AssetLoaderResolveResult>;

/**
 * Resolve CSS, image, font, and Ant Design ESM imports for jsdom acceptance tests.
 *
 * Asset imports resolve to empty JavaScript modules. Ant Design `antd/es/*`
 * imports are redirected to `antd/lib/*` when possible because many Node-based
 * component tests execute through CommonJS-compatible package output.
 */
export async function resolve(specifier: string, context: AssetLoaderResolveContext, nextResolve: NextAssetLoaderResolve): Promise<AssetLoaderResolveResult> {
	if (ASSET_RE.test(specifier)) {
		return {
			shortCircuit: true,
			url: `data:text/javascript,export default ''`,
		};
	}

	// Redirect antd/es/* to antd/lib/* for CJS/ESM compatibility in Node.js
	if (specifier.includes('antd/es/')) {
		const redirected = specifier.replace('antd/es/', 'antd/lib/');
		try {
			return await nextResolve(redirected, context);
		} catch {
			// fall through to default
		}
	}

	return nextResolve(specifier, context);
}
