import type { ChildProcess } from 'node:child_process';

/**
 * Returns true for interrupt-style exits that should be treated as graceful
 * shutdowns when Turbo or the terminal stops a persistent dev process.
 */
export function isGracefulInterruptExit(signal: NodeJS.Signals | null | undefined, code: number | null | undefined): boolean {
	return signal === 'SIGINT' || signal === 'SIGTERM' || signal === 'SIGQUIT' || code === 130 || code === 143;
}

/**
 * Forwards a spawned child process exit code back to the parent process while
 * treating common interrupt exits as a successful shutdown.
 */
export function forwardChildExit(child: ChildProcess): void {
	child.on('exit', (code, signal) => {
		if (isGracefulInterruptExit(signal, code)) {
			process.exitCode = 0;
			return;
		}

		process.exitCode = code ?? 1;
	});
}
