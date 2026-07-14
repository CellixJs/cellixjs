import { describe, expect, it } from 'vitest';
import { ApolloConnection } from './index.tsx';

describe('ApolloConnection export (basic)', () => {
	it('is exported and is a function', () => {
		expect(typeof ApolloConnection).toBe('function');
	});
});
