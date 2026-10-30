import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';

interface LoopbackRedirect {
	/** `http://127.0.0.1:<port>/callback/<random>`, to send as the `redirect_uri`. */
	redirectUri: string;
	/** Resolves with the redirect URL once the browser returns, or rejects after the timeout. */
	callback: Promise<URL>;
	close(): void;
}

/**
 * Listens on `127.0.0.1` for the authorization redirect. Plain HTTP is
 * required here: RFC 8252 loopback redirects use `http`, and the traffic never
 * leaves the machine. The random path and the PKCE verifier protect the code.
 */
export async function listenForLoopbackRedirect(timeoutMs: number): Promise<LoopbackRedirect> {
	const callbackPath = `/callback/${randomUUID()}`;
	let resolveCallback: (url: URL) => void = () => undefined;
	let rejectCallback: (error: unknown) => void = () => undefined;
	const callback = new Promise<URL>((resolve, reject) => {
		resolveCallback = resolve;
		rejectCallback = reject;
	});

	const server = createServer((req, res) => {
		const url = new URL(req.url ?? '/', 'http://127.0.0.1');
		if (url.pathname !== callbackPath) {
			res.writeHead(404).end();
			return;
		}
		res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end('<!doctype html><title>Signed in</title><p>You are signed in. You can close this window and return to the encoder.</p>');
		resolveCallback(url);
	});
	await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
	const timeout = setTimeout(() => rejectCallback(new Error('Timed out waiting for sign-in to finish in the browser')), timeoutMs);

	return {
		redirectUri: `http://127.0.0.1:${(server.address() as AddressInfo).port}${callbackPath}`,
		callback,
		close() {
			clearTimeout(timeout);
			server.close();
		},
	};
}
