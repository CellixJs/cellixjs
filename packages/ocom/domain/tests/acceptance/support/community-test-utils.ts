import { mock } from 'node:test';
import type { CommunityDomainPermissions } from '../../../src/domain/contexts/community/community.domain-permissions.ts';
import type { CommunityPassport } from '../../../src/domain/contexts/community/community.passport.ts';
import type { CommunityVisa } from '../../../src/domain/contexts/community/community.visa.ts';
import type { Passport } from '../../../src/domain/contexts/passport.ts';

/**
 * Helper function to create a mock visa for testing
 */
export function createMockVisa(partialPermissions: Partial<CommunityDomainPermissions>): CommunityVisa {
	const determineIfFn = (fn: (permissions: Readonly<CommunityDomainPermissions>) => boolean) => {
		// biome-ignore lint/plugin/no-type-assertion: test file
		return fn(partialPermissions as CommunityDomainPermissions);
	};

	return {
		determineIf: determineIfFn,
	// biome-ignore lint/plugin/no-type-assertion: test file
	} as CommunityVisa;
}

/**
 * Helper function to create a mock passport for testing
 */
export function createMockPassport(partialPermissions: Partial<CommunityDomainPermissions>): Passport {
	const mockVisa = createMockVisa(partialPermissions);
	const forCommunityFn = mock.fn(() => mockVisa);

	const mockCommunityPassport = {
		forCommunity: forCommunityFn,
	// biome-ignore lint/plugin/no-type-assertion: test file
	} as CommunityPassport;

	return {
		community: mockCommunityPassport,
	// biome-ignore lint/plugin/no-type-assertion: test file
	} as Passport;
}

/**
 * Helper function to generate a string of specific length for testing
 */
export function generateStringOfLength(length: number): string {
	if (length <= 0) {
		return '';
	}

	// Use a repeating pattern to generate the string
	const pattern = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';

	for (let i = 0; i < length; i++) {
		result += pattern[i % pattern.length];
	}

	return result;
}
