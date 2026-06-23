import type { ChildProcess } from 'node:child_process';

/**
 * Returns true for interrupt-style exits that should be treated as graceful
 * shutdowns when Turbo or the terminal stops a persistent dev process.
 */
export function isGracefulInterruptExit(signal: NodeJS.Signals | null | undefined, code: number | null | undefined): boolean {
	return signal === 'SIGINT' || signal === 'SIGTERM' || signal === 'SIGQUIT' || code === 130 || code === 143;
}

/**
 * Sets `process.exitCode` without clobbering a previously recorded failure.
 *
 * A wrapper script can own more than one child process (for example a runner
 * that also forwards an Azurite or Mongo helper's exit). Once any of them has
 * recorded a non-zero code, later successful or graceful exits must not erase
 * it, or the original failure goes unreported.
 */
export function setProcessExitCode(code: number): void {
	if (process.exitCode === undefined || process.exitCode === 0) {
		process.exitCode = code;
	}
}

/**
 * Forwards a spawned child process exit code back to the parent process while
 * treating common interrupt exits as a successful shutdown.
 *
 * This helper sets `process.exitCode` instead of calling `process.exit()`, so a
 * wrapper script can finish naturally and embedders do not lose control of the
 * current Node process. It preserves an already-recorded non-zero exit code
 * rather than overwriting it, so a later, unrelated child exiting cleanly does
 * not mask an earlier failure.
 */
export function forwardChildExit(child: ChildProcess): void {
	child.on('exit', (code, signal) => {
		if (isGracefulInterruptExit(signal, code)) {
			setProcessExitCode(0);
			return;
		}

		setProcessExitCode(code ?? 1);
	});
}
