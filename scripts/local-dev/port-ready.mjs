import net from 'node:net';

/**
 * @typedef {object} WaitForPortOptions
 * @property {number} [timeoutMs]
 * @property {number} [intervalMs]
 */

/**
 * Resolves true if a TCP listener is accepting connections on the given port
 * on 127.0.0.1. Used by the dev launchers to short-circuit when a service is
 * already running (Azurite, Mongo) and by the e2e harness to wait for ports
 * to come up.
 * @param {number} port
 * @returns {Promise<boolean>}
 */
export function isPortListening(port) {
	return new Promise((resolve) => {
		const socket = net.createConnection({ port, host: '127.0.0.1' });
		socket.once('connect', () => {
			socket.destroy();
			resolve(true);
		});
		socket.once('error', () => {
			socket.destroy();
			resolve(false);
		});
	});
}

/**
 * Polls `isPortListening(port)` until it resolves true or the timeout elapses.
 * Resolves true on success, false on timeout — callers decide how to react.
 * @param {number} port
 * @param {WaitForPortOptions} [options]
 * @returns {Promise<boolean>}
 */
export async function waitForPort(port, { timeoutMs = 30_000, intervalMs = 250 } = {}) {
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		if (await isPortListening(port)) return true;
		await new Promise((resolve) => setTimeout(resolve, intervalMs));
	}
	return false;
}
