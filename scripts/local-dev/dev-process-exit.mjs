/** @typedef {import('node:child_process').ChildProcess} ChildProcess */

/**
 * @param {NodeJS.Signals | null | undefined} signal
 * @param {number | null | undefined} code
 * @returns {boolean}
 */
export const isGracefulInterruptExit = (signal, code) => signal === 'SIGINT' || signal === 'SIGTERM' || signal === 'SIGQUIT' || code === 130 || code === 143;

/**
 * Wires a spawned dev child process to forward its exit status to the parent,
 * treating Turbo's interrupt signals as graceful exits. Every `start-dev.mjs`
 * runner ends with the same handler, so this is the single source of truth.
 * @param {ChildProcess} child
 * @returns {void}
 */
export function forwardChildExit(child) {
	child.on('exit', (code, signal) => {
		if (isGracefulInterruptExit(signal, code)) {
			process.exitCode = 0;
			return;
		}
		process.exitCode = code ?? 1;
	});
}
