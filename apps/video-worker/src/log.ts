type LogFields = Record<string, unknown>;

/** Structured logger. Each entry is one JSON line, which Container Apps forwards to Log Analytics. */
export interface WorkerLogger {
	info(event: string, fields?: LogFields): void;
	error(event: string, fields?: LogFields): void;
}

export const consoleLogger: WorkerLogger = {
	info: (event, fields) => {
		console.log(JSON.stringify({ level: 'info', event, time: new Date().toISOString(), ...fields }));
	},
	error: (event, fields) => {
		console.error(JSON.stringify({ level: 'error', event, time: new Date().toISOString(), ...fields }));
	},
};

/** Reduces an unknown error to fields that serialize cleanly. */
export function describeError(error: unknown): LogFields {
	if (error instanceof Error) {
		const { code } = error as { code?: unknown };
		return { name: error.name, message: error.message, ...(code === undefined ? {} : { code }) };
	}
	return { message: String(error) };
}
