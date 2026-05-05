import { describe, expect, it } from 'vitest';
import { getUserIdentityFromMemberData } from './section-layout';

describe('getUserIdentityFromMemberData (unit)', () => {
	it('extracts name from raw profile', () => {
		const memberData = { raw: { name: 'Alice', preferred_username: 'alice123', email: 'a@b.com' } };
		const id = getUserIdentityFromMemberData(memberData);
		expect(id).toBeTruthy();
		expect(id?.displayName).toBe('Alice');
	});

	it('falls back to preferred_username/username/email and default', () => {
		// preferred_username
		expect(getUserIdentityFromMemberData({ raw: { preferred_username: 'pref' } })?.displayName).toBe('pref');
		// username
		expect(getUserIdentityFromMemberData({ raw: { username: 'user' } })?.displayName).toBe('user');
		// email
		expect(getUserIdentityFromMemberData({ raw: { email: 'e@f.com' } })?.displayName).toBe('e@f.com');
		// top-level fields
		expect(getUserIdentityFromMemberData({ name: 'Top', username: 'topuser', email: 't@u.com' })?.displayName).toBe('Top');
		// default
		expect(getUserIdentityFromMemberData({})?.displayName).toBe('Staff User');
	});

	it('preserves onLogout if present', () => {
		const fn = () => undefined;
		const id = getUserIdentityFromMemberData({ onLogout: fn });
		expect(id?.onLogout).toBe(fn);
	});
});
