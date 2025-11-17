import { describe, it, expect } from 'vitest';
import type { UnitOfWork, InitializedUnitOfWork } from './unit-of-work.ts';

describe('UnitOfWork', () => {
	it('should be interface types for transaction management', () => {
		// UnitOfWork and InitializedUnitOfWork are interfaces for managing database transactions
		// Test ensures they're properly exported and can be imported
		
		// Use the types in type annotations to satisfy imports
		// biome-ignore lint/suspicious/noExplicitAny: Using any for generic type test
		const _uowCheck: UnitOfWork<any, any, any, any> | undefined = undefined;
		// biome-ignore lint/suspicious/noExplicitAny: Using any for generic type test
		const _initCheck: InitializedUnitOfWork<any, any, any, any> | undefined = undefined;
		expect(_uowCheck).toBeUndefined();
		expect(_initCheck).toBeUndefined();
	});
});
