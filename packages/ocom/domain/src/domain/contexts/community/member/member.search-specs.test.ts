import { describe, expect, it } from 'vitest';
import { MemberSearchEmail, MemberSearchName, MemberSearchSpec } from './member.search-specs.ts';

describe('Member Search Specifications', () => {
	describe('MemberSearchName', () => {
		it('should create empty search name', () => {
			const searchName = MemberSearchName.create();
			expect(searchName.isEmpty()).toBe(true);
		});

		it('should create search name with value', () => {
			const searchName = MemberSearchName.create('John');
			expect(searchName.isEmpty()).toBe(false);
			expect(searchName.toString()).toBe('John');
		});

		it('should trim whitespace', () => {
			const searchName = MemberSearchName.create('  John  ');
			expect(searchName.toString()).toBe('John');
		});

		it('should match member name case-insensitively', () => {
			const searchName = MemberSearchName.create('john');
			expect(searchName.matches('John Doe')).toBe(true);
			expect(searchName.matches('Jane Smith')).toBe(false);
		});

		it('should match display name if provided', () => {
			const searchName = MemberSearchName.create('johnny');
			expect(
				searchName.matches('John Doe', {
					profile: { displayName: 'Johnny D' },
				}),
			).toBe(true);
		});

		it('should match all when empty', () => {
			const searchName = MemberSearchName.create();
			expect(searchName.matches('Anyone')).toBe(true);
		});
	});

	describe('MemberSearchEmail', () => {
		it('should create empty search email', () => {
			const searchEmail = MemberSearchEmail.create();
			expect(searchEmail.isEmpty()).toBe(true);
		});

		it('should match email addresses case-insensitively', () => {
			const searchEmail = MemberSearchEmail.create('john@example.com');
			const accounts = [{ emailAddress: 'John@Example.com' }];
			expect(searchEmail.matches(accounts)).toBe(true);
		});

		it('should match partial email addresses', () => {
			const searchEmail = MemberSearchEmail.create('example');
			const accounts = [{ emailAddress: 'john@example.com' }, { emailAddress: 'jane@test.org' }];
			expect(searchEmail.matches(accounts)).toBe(true);
		});

		it('should not match non-matching emails', () => {
			const searchEmail = MemberSearchEmail.create('gmail');
			const accounts = [{ emailAddress: 'john@example.com' }];
			expect(searchEmail.matches(accounts)).toBe(false);
		});

		it('should match all when empty', () => {
			const searchEmail = MemberSearchEmail.create();
			const accounts = [{ emailAddress: 'any@example.com' }];
			expect(searchEmail.matches(accounts)).toBe(true);
		});
	});

	describe('MemberSearchSpec', () => {
		it('should create empty search specification', () => {
			const spec = MemberSearchSpec.create();
			expect(spec.isEmpty()).toBe(true);
		});

		it('should create search specification with criteria', () => {
			const spec = MemberSearchSpec.create({
				name: 'John',
				email: 'example.com',
				status: 'active',
				role: 'admin-role-id',
			});
			expect(spec.isEmpty()).toBe(false);
		});

		it('should match member meeting all criteria', () => {
			const spec = MemberSearchSpec.create({
				name: 'john',
				status: 'active',
			});

			const member = {
				memberName: 'John Doe',
				accounts: [{ emailAddress: 'john@example.com', isActive: true }],
				role: { id: 'member-role-id' },
			};

			expect(spec.matches(member)).toBe(true);
		});

		it('should not match member failing name criteria', () => {
			const spec = MemberSearchSpec.create({ name: 'jane' });

			const member = {
				memberName: 'John Doe',
				accounts: [{ emailAddress: 'john@example.com', isActive: true }],
				role: { id: 'member-role-id' },
			};

			expect(spec.matches(member)).toBe(false);
		});

		it('should filter by active status', () => {
			const spec = MemberSearchSpec.create({ status: 'active' });

			const activeMember = {
				memberName: 'Active Member',
				accounts: [{ emailAddress: 'active@example.com', isActive: true }],
				role: { id: 'role-id' },
			};

			const inactiveMember = {
				memberName: 'Inactive Member',
				accounts: [{ emailAddress: 'inactive@example.com', isActive: false }],
				role: { id: 'role-id' },
			};

			expect(spec.matches(activeMember)).toBe(true);
			expect(spec.matches(inactiveMember)).toBe(false);
		});

		it('should filter by role', () => {
			const spec = MemberSearchSpec.create({ role: 'admin-role-id' });

			const adminMember = {
				memberName: 'Admin Member',
				accounts: [{ emailAddress: 'admin@example.com', isActive: true }],
				role: { id: 'admin-role-id' },
			};

			const regularMember = {
				memberName: 'Regular Member',
				accounts: [{ emailAddress: 'member@example.com', isActive: true }],
				role: { id: 'member-role-id' },
			};

			expect(spec.matches(adminMember)).toBe(true);
			expect(spec.matches(regularMember)).toBe(false);
		});

		it('should convert to query criteria excluding defaults', () => {
			const spec = MemberSearchSpec.create({
				name: 'John',
				status: 'active',
			});

			const criteria = spec.toQueryCriteria();
			expect(criteria).toEqual({
				nameSearch: 'John',
				statusFilter: 'active',
			});
		});

		it('should convert empty spec to empty criteria', () => {
			const spec = MemberSearchSpec.create();
			const criteria = spec.toQueryCriteria();
			expect(criteria).toEqual({});
		});
	});
});
