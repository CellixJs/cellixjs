interface TimedEntry<T> {
	value: T;
	expiresAt: number;
}

/** Creates a Map-backed TTL store returning closures. */
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

	return { get, set, delete: del, has };
}
