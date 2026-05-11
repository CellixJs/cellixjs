interface TimedEntry<T> {
	value: T;
	expiresAt: number;
}

/**
 * Creates an in-memory TTL store backed by a Map.
 * Entries expire after `ttlMs` milliseconds.
 * All methods are safe to destructure (no `this` dependency).
 */
export function createTtlStore<T>(ttlMs: number): {
	get(key: string): T | undefined;
	set(key: string, value: T): void;
	has(key: string): boolean;
	delete(key: string): void;
} {
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
