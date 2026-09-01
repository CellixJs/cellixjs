import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { describe, expect, it } from 'vitest';
import type { MemberEntityReference } from '../../../contexts/community/member/member.ts';
import type { PropertyEntityReference } from '../../../contexts/property/property/property.aggregate.ts';
import type { EndUserEntityReference } from '../../../contexts/user/end-user/end-user.ts';
import { MemberPropertyVisa } from './member.property.visa.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/member.property.visa.feature'));

function makeProperty(id = 'property-1', communityId = 'community-1', ownerId = 'member-1') {
	return {
		id,
		community: { id: communityId },
		owner: { id: ownerId },
	} as PropertyEntityReference;
}

function makeUser(id = 'user-1') {
	return { id } as EndUserEntityReference;
}

function makeMember(
	id = 'member-1',
	communityId = 'community-1',
	roleOverrides: Partial<{ propertyPermissions: Record<string, unknown> }> = {},
	accounts: { userId: string; statusCode: string }[] = [{ userId: 'user-1', statusCode: 'ACCEPTED' }],
) {
	return {
		id,
		community: { id: communityId },
		accounts: accounts.map((account) => ({
			user: { id: account.userId },
			statusCode: account.statusCode,
		})),
		role: {
			permissions: {
				propertyPermissions: {
					canManageProperties: true,
					canEditOwnProperty: true,
					...roleOverrides.propertyPermissions,
				},
			},
		},
	} as unknown as MemberEntityReference;
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
	let property: PropertyEntityReference;
	let member: MemberEntityReference;
	let user: EndUserEntityReference;
	let visa: MemberPropertyVisa<PropertyEntityReference>;

	BeforeEachScenario(() => {
		property = makeProperty();
		member = makeMember();
		user = makeUser();
		visa = undefined as unknown as MemberPropertyVisa<PropertyEntityReference>;
	});

	Background(({ Given, And }) => {
		Given('a valid PropertyEntityReference with id "property-1", community id "community-1", owner id "member-1"', () => {
			property = makeProperty('property-1', 'community-1', 'member-1');
		});
		And('a valid MemberEntityReference with id "member-1", community id "community-1", and role with property permissions', () => {
			member = makeMember('member-1', 'community-1');
		});
		And('a valid EndUserEntityReference with id "user-1" acting on the request', () => {
			user = makeUser('user-1');
		});
	});

	describe('MemberPropertyVisa capability boundaries', () => {
		it('allows an accepted own-property member to view a foreign same-community property without treating it as editable', () => {
			const foreignProperty = makeProperty('property-2', 'community-1', 'member-2');
			const ownPropertyMember = makeMember('member-1', 'community-1', { propertyPermissions: { canManageProperties: false, canEditOwnProperty: true } }, [{ userId: 'user-1', statusCode: 'ACCEPTED' }]);
			const visa = new MemberPropertyVisa(foreignProperty, ownPropertyMember, makeUser());

			expect(visa.determineIf((permissions) => permissions.canEditOwnProperty)).toBe(true);
			expect(visa.determineIf((permissions) => permissions.isEditingOwnProperty)).toBe(false);
		});

		it('fails closed when an accepted member has no role', () => {
			const memberWithoutRole = {
				...makeMember('member-1', 'community-1', { propertyPermissions: { canManageProperties: false, canEditOwnProperty: true } }, [{ userId: 'user-1', statusCode: 'ACCEPTED' }]),
				role: undefined,
			} as unknown as MemberEntityReference;
			const visa = new MemberPropertyVisa(makeProperty(), memberWithoutRole, makeUser());

			expect(visa.determineIf(() => true)).toBe(false);
		});
	});

	Scenario('Creating a MemberPropertyVisa with a member belonging to the community', ({ When, Then }) => {
		When('I create a MemberPropertyVisa with the property and member', () => {
			visa = new MemberPropertyVisa(property, member, user);
		});
		Then('the visa should be created successfully', () => {
			expect(visa).toBeInstanceOf(MemberPropertyVisa);
		});
	});

	Scenario('determineIf returns true when the permission function returns true', ({ Given, When, Then }) => {
		let result: boolean;
		Given('a MemberPropertyVisa for the property and member', () => {
			visa = new MemberPropertyVisa(property, member, user);
		});
		When('I call determineIf with a function that returns true if canManageProperties is true', () => {
			result = visa.determineIf((p) => p.canManageProperties === true);
		});
		Then('the result should be true', () => {
			expect(result).toBe(true);
		});
	});

	Scenario('determineIf returns false when the permission function returns false', ({ Given, When, Then }) => {
		let result: boolean;
		Given('a MemberPropertyVisa for the property and member', () => {
			visa = new MemberPropertyVisa(property, member, user);
		});
		When('I call determineIf with a function that returns false', () => {
			result = visa.determineIf(() => false);
		});
		Then('the result should be false', () => {
			expect(result).toBe(false);
		});
	});

	Scenario('determineIf returns false if the member does not belong to the community', ({ Given, And, When, Then }) => {
		let result: boolean;
		Given('a MemberEntityReference with community id "community-2"', () => {
			member = makeMember('member-1', 'community-2');
		});
		And('a PropertyEntityReference with community id "community-1"', () => {
			property = makeProperty('property-1', 'community-1', 'member-1');
		});
		When('I create a MemberPropertyVisa with the property and member', () => {
			visa = new MemberPropertyVisa(property, member, user);
		});
		And('I call determineIf with any function', () => {
			result = visa.determineIf(() => true);
		});
		Then('the result should be false', () => {
			expect(result).toBe(false);
		});
	});

	Scenario("determineIf returns true if the member's role has the required permission", ({ Given, And, When, Then }) => {
		let result: boolean;
		Given('a MemberEntityReference with propertyPermissions where canManageProperties is true', () => {
			member = makeMember('member-1', 'community-1', {
				propertyPermissions: { canManageProperties: true },
			});
		});
		And('a PropertyEntityReference with community id "community-1"', () => {
			property = makeProperty('property-1', 'community-1', 'member-1');
		});
		When('I create a MemberPropertyVisa with the property and member', () => {
			visa = new MemberPropertyVisa(property, member, user);
		});
		And('I call determineIf with a function that returns canManageProperties', () => {
			result = visa.determineIf((p) => p.canManageProperties === true);
		});
		Then('the result should be true', () => {
			expect(result).toBe(true);
		});
	});

	Scenario("determineIf returns false if the member's role does not have the required permission", ({ Given, And, When, Then }) => {
		let result: boolean;
		Given('a MemberEntityReference with propertyPermissions where canManageProperties is false', () => {
			member = makeMember('member-1', 'community-1', {
				propertyPermissions: { canManageProperties: false },
			});
		});
		And('a PropertyEntityReference with community id "community-1"', () => {
			property = makeProperty('property-1', 'community-1', 'member-1');
		});
		When('I create a MemberPropertyVisa with the property and member', () => {
			visa = new MemberPropertyVisa(property, member, user);
		});
		And('I call determineIf with a function that returns canManageProperties', () => {
			result = visa.determineIf((p) => p.canManageProperties === true);
		});
		Then('the result should be false', () => {
			expect(result).toBe(false);
		});
	});

	Scenario('determineIf sets isEditingOwnProperty to true when member is the owner', ({ Given, When, Then }) => {
		let result: boolean;
		Given('a MemberPropertyVisa for the property and member', () => {
			visa = new MemberPropertyVisa(property, member, user);
		});
		When('I call determineIf with a function that returns isEditingOwnProperty', () => {
			result = visa.determineIf((p) => p.isEditingOwnProperty);
		});
		Then('the result should be true', () => {
			expect(result).toBe(true);
		});
	});

	Scenario('determineIf sets isEditingOwnProperty to false when member is not the owner', ({ Given, When, Then, And }) => {
		let result: boolean;
		Given('a MemberEntityReference with id "member-2"', () => {
			member = makeMember('member-2', 'community-1');
		});
		When('I create a MemberPropertyVisa with the property and member', () => {
			visa = new MemberPropertyVisa(property, member, user);
		});
		And('I call determineIf with a function that returns isEditingOwnProperty', () => {
			result = visa.determineIf((p) => p.isEditingOwnProperty);
		});
		Then('the result should be false', () => {
			expect(result).toBe(false);
		});
	});

	Scenario('determineIf sets canEditOwnProperty based on role permissions', ({ Given, When, Then, And }) => {
		let result: boolean;
		Given('a MemberEntityReference with propertyPermissions where canEditOwnProperty is true', () => {
			member = makeMember('member-1', 'community-1', {
				propertyPermissions: { canEditOwnProperty: true },
			});
		});
		When('I create a MemberPropertyVisa with the property and member', () => {
			visa = new MemberPropertyVisa(property, member, user);
		});
		And('I call determineIf with a function that returns canEditOwnProperty', () => {
			result = visa.determineIf((p) => p.canEditOwnProperty);
		});
		Then('the result should be true', () => {
			expect(result).toBe(true);
		});
	});

	Scenario('determineIf sets isSystemAccount to false', ({ Given, When, Then }) => {
		let result: boolean;
		Given('a MemberPropertyVisa for the property and member', () => {
			visa = new MemberPropertyVisa(property, member, user);
		});
		When('I call determineIf with a function that returns isSystemAccount', () => {
			result = visa.determineIf((p) => p.isSystemAccount);
		});
		Then('the result should be false', () => {
			expect(result).toBe(false);
		});
	});

	Scenario("determineIf returns true when the acting user's member account is accepted", ({ Given, When, And, Then }) => {
		let result: boolean;
		Given('a MemberEntityReference whose account for the acting user has status "ACCEPTED"', () => {
			member = makeMember('member-1', 'community-1', {}, [{ userId: 'user-1', statusCode: 'ACCEPTED' }]);
		});
		When('I create a MemberPropertyVisa with the property and member', () => {
			visa = new MemberPropertyVisa(property, member, user);
		});
		And('I call determineIf with a function that returns canManageProperties', () => {
			result = visa.determineIf((p) => p.canManageProperties);
		});
		Then('the result should be true', () => {
			expect(result).toBe(true);
		});
	});

	Scenario("determineIf returns false when the acting user's member account is rejected", ({ Given, When, And, Then }) => {
		let result: boolean;
		Given('a MemberEntityReference whose account for the acting user has status "REJECTED"', () => {
			member = makeMember('member-1', 'community-1', {}, [{ userId: 'user-1', statusCode: 'REJECTED' }]);
		});
		When('I create a MemberPropertyVisa with the property and member', () => {
			visa = new MemberPropertyVisa(property, member, user);
		});
		And('I call determineIf with a function that returns canManageProperties', () => {
			result = visa.determineIf((p) => p.canManageProperties);
		});
		Then('the result should be false', () => {
			expect(result).toBe(false);
		});
	});

	Scenario("determineIf returns false when the acting user's member account is still pending", ({ Given, When, And, Then }) => {
		let result: boolean;
		Given('a MemberEntityReference whose account for the acting user has status "CREATED"', () => {
			member = makeMember('member-1', 'community-1', {}, [{ userId: 'user-1', statusCode: 'CREATED' }]);
		});
		When('I create a MemberPropertyVisa with the property and member', () => {
			visa = new MemberPropertyVisa(property, member, user);
		});
		And('I call determineIf with a function that returns canManageProperties', () => {
			result = visa.determineIf((p) => p.canManageProperties);
		});
		Then('the result should be false', () => {
			expect(result).toBe(false);
		});
	});

	Scenario('determineIf returns false when the acting user has no account on the member', ({ Given, When, And, Then }) => {
		let result: boolean;
		Given('a MemberEntityReference with no account for the acting user', () => {
			member = makeMember('member-1', 'community-1', {}, [{ userId: 'user-2', statusCode: 'ACCEPTED' }]);
		});
		When('I create a MemberPropertyVisa with the property and member', () => {
			visa = new MemberPropertyVisa(property, member, user);
		});
		And('I call determineIf with a function that returns canManageProperties', () => {
			result = visa.determineIf((p) => p.canManageProperties);
		});
		Then('the result should be false', () => {
			expect(result).toBe(false);
		});
	});
});
