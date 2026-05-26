/** @typedef {import('node:child_process').ChildProcess} ChildProcess */

const INTERRUPT_SIGNALS = new Set(['SIGINT', 'SIGTERM', 'SIGQUIT']);
const INTERRUPT_EXIT_CODES = new Set([130, 143]);

/**
 * @param {NodeJS.Signals | null | undefined} signal
 * @returns {boolean}
 */
export const isInterruptSignal = (signal) => Boolean(signal && INTERRUPT_SIGNALS.has(signal));

/**
 * @param {number | null | undefined} code
 * @returns {boolean}
 */
export const isInterruptExitCode = (code) => Number.isInteger(code) && INTERRUPT_EXIT_CODES.has(/** @type {number} */ (code));

/**
 * @param {NodeJS.Signals | null | undefined} signal
 * @param {number | null | undefined} code
 * @returns {boolean}
 */
export const isGracefulInterruptExit = (signal, code) => isInterruptSignal(signal) || isInterruptExitCode(code);

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
