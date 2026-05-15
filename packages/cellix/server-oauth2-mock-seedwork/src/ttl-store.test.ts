import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTtlStore } from './ttl-store.ts';

describe('createTtlStore', () => {
	beforeEach(() => {
		vi.useRealTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('get returns undefined for a missing key', () => {
		const store = createTtlStore<number>(1000);

		expect(store.get('missing')).toBeUndefined();
	});

	it('set then get returns the stored value', () => {
		const store = createTtlStore<number>(1000);

		store.set('answer', 42);

		expect(store.get('answer')).toBe(42);
	});

	it('has returns false for a missing key and true after set', () => {
		const store = createTtlStore<number>(1000);

		expect(store.has('answer')).toBe(false);

		store.set('answer', 42);

		expect(store.has('answer')).toBe(true);
	});

	it('delete removes the key', () => {
		const store = createTtlStore<number>(1000);

		store.set('answer', 42);
		store.delete('answer');

		expect(store.get('answer')).toBeUndefined();
		expect(store.has('answer')).toBe(false);
	});

	it('expires entries after the configured ttl', () => {
		vi.useFakeTimers();
		const store = createTtlStore<number>(1000);

		store.set('answer', 42);
		vi.advanceTimersByTime(1001);

		expect(store.get('answer')).toBeUndefined();
	});

	it('is safe to destructure', () => {
		const { get, set } = createTtlStore<number>(1000);

		set('k', 42);

		expect(get('k')).toBe(42);
	});
});
