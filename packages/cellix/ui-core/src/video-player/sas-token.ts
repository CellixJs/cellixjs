/**
 * Returns a request filter body that appends a SAS token to URIs on the same
 * origin as the source, so the token is never sent to third-party hosts.
 * URIs that already carry a signature are left untouched.
 */
export function createSasTokenAppender(src: string, sasToken: string): (uri: string) => string {
	const sourceOrigin = new URL(src, globalThis.location?.href).origin;
	const tokenParams = new URLSearchParams(sasToken.replace(/^\?/, ''));

	return (uri) => {
		const url = new URL(uri, src);
		if (url.origin !== sourceOrigin || url.searchParams.has('sig')) return uri;
		for (const [key, value] of tokenParams) {
			url.searchParams.set(key, value);
		}
		return url.toString();
	};
}
