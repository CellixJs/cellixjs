import { spawn } from 'node:child_process';

const STDERR_LIMIT = 4000;

type ProcessFailureKind = 'spawn' | 'exit' | 'aborted';

export class ProcessFailure extends Error {
	public readonly kind: ProcessFailureKind;

	constructor(kind: ProcessFailureKind, message: string, options?: { cause?: unknown }) {
		super(message, options);
		this.name = 'ProcessFailure';
		this.kind = kind;
	}
}

interface RunProcessOptions {
	cwd?: string;
	signal?: AbortSignal;
	/** Receives stdout line by line instead of buffering it into the result. */
	onStdoutLine?: (line: string) => void;
}

/**
 * Runs an executable to completion. Rejects with a `ProcessFailure` when it
 * cannot be started, exits with a non-zero code, or is killed by `signal`.
 * Only the tail of stderr is kept, for error messages.
 */
export function runProcess(command: string, args: string[], options: RunProcessOptions = {}): Promise<string> {
	const { cwd, signal, onStdoutLine } = options;

	return new Promise((resolve, reject) => {
		if (signal?.aborted) {
			reject(new ProcessFailure('aborted', `${command} was aborted before it started`));
			return;
		}

		const child = spawn(command, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
		let stdout = '';
		let pendingLine = '';
		let stderr = '';
		let settled = false;

		const onAbort = () => {
			child.kill('SIGKILL');
		};
		signal?.addEventListener('abort', onAbort, { once: true });

		const settle = (outcome: () => void) => {
			if (settled) {
				return;
			}
			settled = true;
			signal?.removeEventListener('abort', onAbort);
			outcome();
		};

		child.stdout.setEncoding('utf8');
		child.stdout.on('data', (chunk: string) => {
			if (!onStdoutLine) {
				stdout += chunk;
				return;
			}
			const lines = (pendingLine + chunk).split('\n');
			pendingLine = lines.pop() ?? '';
			for (const line of lines) {
				onStdoutLine(line.trim());
			}
		});

		child.stderr.setEncoding('utf8');
		child.stderr.on('data', (chunk: string) => {
			stderr = (stderr + chunk).slice(-STDERR_LIMIT);
		});

		child.once('error', (error) => {
			settle(() => reject(new ProcessFailure('spawn', `${command} could not be started: ${error.message}`, { cause: error })));
		});

		child.once('close', (code: number | null) => {
			settle(() => {
				if (signal?.aborted) {
					reject(new ProcessFailure('aborted', `${command} was aborted`));
				} else if (code === 0) {
					if (onStdoutLine && pendingLine) {
						onStdoutLine(pendingLine.trim());
					}
					resolve(stdout);
				} else {
					reject(new ProcessFailure('exit', `${command} exited with code ${String(code)}: ${stderr.trim()}`));
				}
			});
		});
	});
}
