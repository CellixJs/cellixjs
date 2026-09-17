import type { Domain } from '@ocom/domain';
import { describe, expect, it } from 'vitest';
import { billableMemberCount, isBillableMember } from './billable-members.ts';

const member = (...statusCodes: string[]) => ({ accounts: statusCodes.map((statusCode) => ({ statusCode })) }) as unknown as Domain.Contexts.Community.Member.MemberEntityReference;

describe('billable members', () => {
	it('counts a member with an accepted account', () => {
		expect(isBillableMember(member('ACCEPTED'))).toBe(true);
	});

	it('counts a seat an administrator created directly', () => {
		expect(isBillableMember(member())).toBe(true);
	});

	it('does not count a deactivated member', () => {
		expect(isBillableMember(member('REJECTED'))).toBe(false);
	});

	it('does not count an invitation that was never accepted', () => {
		expect(isBillableMember(member('CREATED'))).toBe(false);
	});

	it('counts a member who was reactivated after being deactivated', () => {
		expect(isBillableMember(member('REJECTED', 'ACCEPTED'))).toBe(true);
	});

	it('excludes deactivated and pending members from the charge', () => {
		expect(billableMemberCount([member('ACCEPTED'), member(), member('REJECTED'), member('CREATED')])).toBe(2);
	});
});
