import type { ChildProcess } from 'node:child_process';
import path from 'node:path';
import { isGracefulInterruptExit, setProcessExitCode } from '../process/index.ts';
import { sanitizeWorktreeHostnameLabel } from '../urls/index.ts';
import { resolveWorkspaceRoot } from '../workspace/index.ts';
import { getAzuritePorts } from '../worktree/ports.ts';
import { resolveWorktreeName } from '../worktree/worktree-name.ts';
import { spawnInherited } from './spawn.ts';
import type { RunnerOptions } from './types.ts';

function getWorktreeStorageSuffix(worktreeName: string | undefined): string {
	const safeLabel = sanitizeWorktreeHostnameLabel(worktreeName);
	return safeLabel ? `-${safeLabel}` : '';
}

export interface AzuriteDevOptions extends RunnerOptions {
	/** Workspace root used for storage directories. Defaults to auto-discovery. */
	workspaceRoot?: string;
	/** Storage directory names before worktree suffixing. */
	storageDirectories?: {
		blob?: string;
		queue?: string;
		table?: string;
	};
	/** Whether Azurite should run quietly. Defaults to `true`. */
	silent?: boolean;
}

/**
 * Resolved Azurite ports and storage locations after worktree scoping.
 */
export interface ResolvedAzuriteOptions {
	/** Blob service port. */
	blobPort: number;
	/** Queue service port. */
	queuePort: number;
	/** Table service port. */
	tablePort: number;
	/** Blob storage working directory. */
	blobLocation: string;
	/** Queue storage working directory. */
	queueLocation: string;
	/** Table storage working directory. */
	tableLocation: string;
}

/**
 * Starts the three Azurite worker processes on worktree-scoped ports and
 * storage directories.
 *
 * When no worktree is active the runner falls back to Azurite's default ports
 * and unsuffixed storage directories. All three services inherit stdio; if one
 * exits unexpectedly the runner terminates the others and sets the parent
 * process exit code for CLI callers without forcing embedders to exit.
 */
export class AzuriteDevRunner {
	private readonly options: AzuriteDevOptions;

	public constructor(options: AzuriteDevOptions = {}) {
		this.options = options;
	}

	/**
	 * Resolves the worktree-scoped Azurite ports and storage locations.
	 *
	 * @returns Ports and storage directories for the active worktree, or the
	 * defaults when no worktree is active.
	 */
	public resolveOptions(): ResolvedAzuriteOptions {
		const worktreeName = resolveWorktreeName(this.options);
		const workspaceRoot = this.options.workspaceRoot ?? resolveWorkspaceRoot();
		const ports = getAzuritePorts(worktreeName);
		const storageSuffix = getWorktreeStorageSuffix(worktreeName);
		const directories = this.options.storageDirectories ?? {};

		return {
			blobPort: ports.blob,
			blobLocation: path.join(workspaceRoot, `${directories.blob ?? '__blobstorage__'}${storageSuffix}`),
			queuePort: ports.queue,
			queueLocation: path.join(workspaceRoot, `${directories.queue ?? '__queuestorage__'}${storageSuffix}`),
			tablePort: ports.table,
			tableLocation: path.join(workspaceRoot, `${directories.table ?? '__tablestorage__'}${storageSuffix}`),
		};
	}

	/**
	 * Spawns blob, queue, and table Azurite processes.
	 *
	 * @returns The spawned Azurite child processes.
	 */
	public start(): ChildProcess[] {
		const resolved = this.resolveOptions();
		const silent = this.options.silent ?? true;
		const commonArgs = [...(silent ? ['--silent'] : []), '--skipApiVersionCheck'];
		const azuriteProcesses: Array<[string, string[]]> = [
			['azurite-blob', [...commonArgs, '--blobPort', String(resolved.blobPort), '--location', path.resolve(resolved.blobLocation)]],
			['azurite-queue', [...commonArgs, '--queuePort', String(resolved.queuePort), '--location', path.resolve(resolved.queueLocation)]],
			['azurite-table', [...commonArgs, '--tablePort', String(resolved.tablePort), '--location', path.resolve(resolved.tableLocation)]],
		];

		let procs: ChildProcess[] = [];
		const stopAzuriteProcesses = (signal?: NodeJS.Signals) => {
			for (const proc of procs) {
				proc.kill(signal);
			}
		};
		const stopOnSigint = () => stopAzuriteProcesses('SIGINT');
		const stopOnSigterm = () => stopAzuriteProcesses('SIGTERM');
		const removeSignalHandlers = () => {
			process.off('SIGINT', stopOnSigint);
			process.off('SIGTERM', stopOnSigterm);
		};

		procs = azuriteProcesses.map(([command, args]) => {
			const proc = spawnInherited(command, args, {
				...(this.options.env ? { env: this.options.env } : {}),
				...(this.options.spawn ? { spawn: this.options.spawn } : {}),
			});
			proc.on('error', (error) => {
				console.error(`[azurite] failed to start ${command}: ${error.message}`);
				stopAzuriteProcesses();
				removeSignalHandlers();
				setProcessExitCode(1);
			});
			return proc;
		});

		console.log(`[azurite] started (blob=${resolved.blobPort}, queue=${resolved.queuePort}, table=${resolved.tablePort})`);

		let exited = 0;
		for (const proc of procs) {
			proc.on('exit', (code, signal) => {
				if (isGracefulInterruptExit(signal, code)) {
					if (++exited === procs.length) {
						removeSignalHandlers();
						setProcessExitCode(0);
					}
					return;
				}

				console.error(`[azurite] process exited unexpectedly: code=${code} signal=${signal}`);
				stopAzuriteProcesses();
				removeSignalHandlers();
				setProcessExitCode(code ?? 1);
			});
		}

		process.on('SIGINT', stopOnSigint);
		process.on('SIGTERM', stopOnSigterm);

		return procs;
	}
}
