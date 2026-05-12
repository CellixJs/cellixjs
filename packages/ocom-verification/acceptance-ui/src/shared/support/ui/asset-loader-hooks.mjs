/**
 * ESM loader hooks that intercept CSS, image, and other non-JS imports so
 * they resolve to empty modules instead of throwing in Node.js.
 *
 * Usage: `NODE_OPTIONS='--import ./src/shared/support/ui/register-asset-loader.ts' cucumber-js`
 */

const ASSET_RE = /\.(css|less|scss|sass|svg|png|jpe?g|gif|webp|woff2?|ttf|eot|ico)$/i;

/**
 * @param {string} specifier
 * @param {{ parentURL?: string }} context
 * @param {Function} nextResolve
 */
export async function resolve(specifier, context, nextResolve) {
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
