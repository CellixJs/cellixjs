interface TimedEntry<T> {
	value: T;
	expiresAt: number;
}

/** Creates a Map-backed TTL store returning closures with periodic cleanup. */
export function createTtlStore<T>(ttlMs: number) {
	const store = new Map<string, TimedEntry<T>>();

	const get = (key: string): T | undefined => {
		const entry = store.get(key);
		if (!entry) return undefined;
		if (Date.now() > entry.expiresAt) {
			store.delete(key);
			return undefined;
		}
		return entry.value;
	};

	const set = (key: string, value: T): void => {
		store.set(key, { value, expiresAt: Date.now() + ttlMs });
	};

	const del = (key: string): void => {
		store.delete(key);
	};

	const has = (key: string): boolean => get(key) !== undefined;

	// Sweep expired entries periodically to prevent unbounded memory growth on abandoned keys
	const sweepInterval = setInterval(
		() => {
			const now = Date.now();
			for (const [key, entry] of store.entries()) {
				if (now > entry.expiresAt) {
					store.delete(key);
				}
			}
		},
		Math.max(ttlMs, 5000),
	); // Sweep at least every 5 seconds

	const stop = (): void => clearInterval(sweepInterval);

	return { get, set, delete: del, has, stop };
}
