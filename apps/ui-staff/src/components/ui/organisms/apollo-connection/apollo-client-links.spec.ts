import type { Operation } from '@apollo/client';
import { describe, expect, it } from 'vitest';
import { ApolloLinkToAddCustomHeader } from './apollo-client-links';

describe('ApolloLinkToAddCustomHeader', () => {
	it('adds header to operation context without mutating previous headers', () => {
		const link = ApolloLinkToAddCustomHeader('x-community-id', 'community-123');

		// Minimal mock of an Apollo Operation that supports setContext/getContext
		type OpContext = Record<string, unknown> & { headers?: Record<string, unknown> };
		type MockOperation = {
			_context: OpContext;
			setContext: (fnOrObj: ((prev: OpContext) => OpContext) | OpContext) => void;
			getContext: () => OpContext;
			operationName: string;
			query: unknown;
			variables: unknown;
		};

		const mockOp: MockOperation = {
			_context: {} as OpContext,
			setContext(fnOrObj) {
				if (typeof fnOrObj === 'function') {
					this._context = (fnOrObj as (prev: OpContext) => OpContext)(this._context ?? {});
				} else {
					this._context = { ...(this._context ?? {}), ...(fnOrObj as OpContext) };
				}
			},
			getContext() {
				return this._context;
			},
			operationName: 'Test',
			query: {},
			variables: {},
		};

		// seed previous headers to ensure merge happens
		mockOp.setContext({ headers: { existing: 'value' } });

		const forward = (() => ({ subscribe: () => ({}) })) as unknown as (op?: Operation) => { subscribe: () => unknown };

		// execute the link (cast to Operation only at the call-site)
		link.request(mockOp as unknown as Operation, forward);

		const ctx = mockOp.getContext();
		expect(ctx).toBeTruthy();
		expect(ctx.headers).toBeTruthy();
		const headers = ctx.headers as Record<string, unknown>;
		expect(headers['x-community-id']).toBe('community-123');
		expect(headers.existing).toBe('value');
	});
});
