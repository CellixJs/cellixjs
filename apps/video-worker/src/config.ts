/**
 * How the worker runs.
 *
 * - `once`: process at most one message, then exit. Used by the Azure
 *   Container Apps Job, which starts one execution per queued message.
 * - `loop`: keep processing messages, sleeping when the queue is empty, until
 *   stopped. Used for local development, where there is no job trigger.
 */
type WorkerMode = 'once' | 'loop';

export interface WorkerConfig {
	mode: WorkerMode;
	storage: {
		accountName: string;
		/** Present for local development against Azurite. Absent in Azure, where managed identity is used. */
		connectionString: string | undefined;
	};
	encoder: {
		ffmpegPath: string | undefined;
		ffprobePath: string | undefined;
		packagerPath: string | undefined;
		workingDirectory: string | undefined;
	};
	queue: {
		visibilityTimeoutSeconds: number;
		maxDequeueCount: number;
	};
	pollIntervalSeconds: number;
}

/**
 * Reads worker configuration from environment variables.
 *
 * | Variable | Default | Meaning |
 * |---|---|---|
 * | `WORKER_MODE` | `once` | `once` or `loop` |
 * | `AZURE_STORAGE_ACCOUNT_NAME` | required | Storage account holding the queue and blobs |
 * | `AZURE_STORAGE_CONNECTION_STRING` | unset | Azurite connection string for local development |
 * | `FFMPEG_PATH`, `FFPROBE_PATH`, `PACKAGER_PATH` | on `PATH` | Encoder executables |
 * | `ENCODING_WORKING_DIRECTORY` | OS temp dir | Scratch space for encode jobs |
 * | `QUEUE_VISIBILITY_TIMEOUT_SECONDS` | 300 | Message lease, renewed while encoding |
 * | `QUEUE_MAX_DEQUEUE_COUNT` | 5 | Deliveries before a message is poisoned |
 * | `QUEUE_POLL_INTERVAL_SECONDS` | 5 | Sleep between empty polls in `loop` mode |
 *
 * @throws {Error} When a required variable is missing or a value is invalid.
 */
export function readWorkerConfig(env: NodeJS.ProcessEnv = process.env): WorkerConfig {
	const { WORKER_MODE, AZURE_STORAGE_ACCOUNT_NAME, AZURE_STORAGE_CONNECTION_STRING, FFMPEG_PATH, FFPROBE_PATH, PACKAGER_PATH, ENCODING_WORKING_DIRECTORY } = env;

	const mode = WORKER_MODE ?? 'once';
	if (mode !== 'once' && mode !== 'loop') {
		throw new Error(`WORKER_MODE must be 'once' or 'loop', got '${mode}'`);
	}
	if (!AZURE_STORAGE_ACCOUNT_NAME?.trim()) {
		throw new Error('AZURE_STORAGE_ACCOUNT_NAME is required');
	}

	return {
		mode,
		storage: {
			accountName: AZURE_STORAGE_ACCOUNT_NAME,
			connectionString: AZURE_STORAGE_CONNECTION_STRING?.trim() || undefined,
		},
		encoder: {
			ffmpegPath: FFMPEG_PATH,
			ffprobePath: FFPROBE_PATH,
			packagerPath: PACKAGER_PATH,
			workingDirectory: ENCODING_WORKING_DIRECTORY,
		},
		queue: {
			visibilityTimeoutSeconds: positiveInteger(env, 'QUEUE_VISIBILITY_TIMEOUT_SECONDS', 300),
			maxDequeueCount: positiveInteger(env, 'QUEUE_MAX_DEQUEUE_COUNT', 5),
		},
		pollIntervalSeconds: positiveInteger(env, 'QUEUE_POLL_INTERVAL_SECONDS', 5),
	};
}

function positiveInteger(env: NodeJS.ProcessEnv, name: string, fallback: number): number {
	const raw = env[name];
	if (raw === undefined || raw.trim() === '') {
		return fallback;
	}
	const value = Number(raw);
	if (!Number.isInteger(value) || value <= 0) {
		throw new Error(`${name} must be a positive integer, got '${raw}'`);
	}
	return value;
}
