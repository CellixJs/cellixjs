import { Before, Given, Then, When } from '@cucumber/cucumber';
import assert from 'node:assert';
import { Member } from '../../../src/domain/contexts/community/member/member.ts';
import { MemberActivatedEvent } from '../../../src/domain/events/types/member-activated.ts';
import { MemberRemovedEvent } from '../../../src/domain/events/types/member-removed.ts';
import type { Passport } from '../../../src/domain/contexts/passport.ts';
import type { MemberProps } from '../../../src/domain/contexts/community/member/member.ts';
import { createMemberProps, createMockPassport } from '../support/member-test-utils.ts';
let passport: Passport;
let member: Member<MemberProps>;

Before(() => {
	passport = createMockPassport({ canManageMembers: true });
	member = undefined as unknown as Member<MemberProps>;
});

Given('I am an authorized community administrator for member management', () => {
	passport = createMockPassport({ canManageMembers: true });
	assert.ok(passport);
});

Given('a member exists with a pending account', () => {
	member = new Member(createMemberProps('CREATED'), passport);
	assert.ok(member);
});

When('I activate the member', () => {
	member.requestActivateMember();
});

Then('the member should be active', () => {
	assert.strictEqual(member.isActiveMember, true);
	assert.strictEqual(member.accounts[0]?.statusCode, 'ACCEPTED');
	assert.ok(member.getDomainEvents().some((event) => event instanceof MemberActivatedEvent));
});

When('I remove the member', () => {
	member.requestRemoveMember();
});

Then('the member should be marked as removed', () => {
	assert.strictEqual(member.isDeleted, true);
	assert.ok(member.getDomainEvents().some((event) => event instanceof MemberRemovedEvent));
});
