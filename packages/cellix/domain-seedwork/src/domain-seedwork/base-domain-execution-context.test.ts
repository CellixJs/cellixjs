import { describe, it, expect } from 'vitest';
import type { BaseDomainExecutionContext } from './base-domain-execution-context.ts';

describe('BaseDomainExecutionContext', () => {
	it('should be an interface that can be extended', () => {
		// This is a type-only interface used as a base for other execution contexts
		// Test ensures it's properly exported and can be imported
		const context: BaseDomainExecutionContext = {};
		expect(context).toBeDefined();
	});
});
