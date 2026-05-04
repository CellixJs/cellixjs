import { describe, expect, it, vi } from 'vitest';

// Hoisted mocks — resolved before any static import of the module under test

vi.mock('@graphql-tools/merge', () => ({
	mergeResolvers: vi.fn().mockReturnValue({
		Query: {
			hello: vi.fn(),
			currentCommunity: vi.fn(),
			endUserRole: vi.fn(),
		},
		Mutation: {
			communityCreate: vi.fn(),
		},
	}),
}));

vi.mock('./resolver-manifest.generated.ts', () => ({
	ocomGraphqlResolvers: [{ Query: { hello: vi.fn() } }, { Query: { currentCommunity: vi.fn() }, Mutation: { communityCreate: vi.fn() } }],
	ocomGraphqlPermissions: [],
}));

vi.mock('../types/end-user-role.resolvers.ts', () => ({
	default: { Query: { endUserRole: vi.fn() } },
}));

import { mergeResolvers } from '@graphql-tools/merge';
import { permissions, resolvers } from './resolver-builder.ts';

describe('resolver-builder', () => {
	describe('resolvers — mergeResolverModules with non-empty modules', () => {
		it('passes all resolver modules to mergeResolvers', () => {
			expect(vi.mocked(mergeResolvers)).toHaveBeenCalledOnce();
			const [calledModules] = vi.mocked(mergeResolvers).mock.calls[0] ?? [];
			expect(Array.isArray(calledModules)).toBe(true);
			expect((calledModules as unknown[]).length).toBeGreaterThan(0);
		});

		it('returns the merged object produced by mergeResolvers', () => {
			expect(resolvers).toBeDefined();
			expect(typeof resolvers).toBe('object');
		});

		it('exposes Query resolvers from the merged result', () => {
			expect(resolvers.Query).toBeDefined();
			expect(typeof resolvers.Query?.hello).toBe('function');
			expect(typeof resolvers.Query?.currentCommunity).toBe('function');
			expect(typeof resolvers.Query?.endUserRole).toBe('function');
		});

		it('exposes Mutation resolvers from the merged result', () => {
			expect(resolvers.Mutation).toBeDefined();
			expect(typeof resolvers.Mutation?.communityCreate).toBe('function');
		});
	});

	describe('permissions — mergeResolverModules with empty modules', () => {
		it('returns an empty object when ocomGraphqlPermissions is empty', () => {
			expect(permissions).toEqual({});
		});

		it('does not invoke mergeResolvers for an empty permissions array', () => {
			// mergeResolvers is called exactly once: for resolvers (non-empty), never for permissions (empty)
			expect(vi.mocked(mergeResolvers)).toHaveBeenCalledTimes(1);
		});
	});

	describe('mergeResolverModules — non-empty permissions path', () => {
		it('calls mergeResolvers and returns its result when permission modules are present', async () => {
			vi.resetModules();

			const permResolver = { Query: { permCheck: vi.fn() } };
			const mergeResolversMock = vi.fn().mockReturnValue(permResolver);

			vi.doMock('@graphql-tools/merge', () => ({ mergeResolvers: mergeResolversMock }));
			vi.doMock('./resolver-manifest.generated.ts', () => ({
				ocomGraphqlResolvers: [],
				ocomGraphqlPermissions: [permResolver],
			}));
			vi.doMock('../types/end-user-role.resolvers.ts', () => ({ default: {} }));

			const { permissions: dynamicPermissions } = await import('./resolver-builder.ts');

			expect(mergeResolversMock).toHaveBeenCalled();
			expect(dynamicPermissions).toEqual(permResolver);

			vi.resetModules();
		});
	});
});
