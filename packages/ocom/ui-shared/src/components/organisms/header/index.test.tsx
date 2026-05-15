import { describe, expect, it } from 'vitest';
import { HandleLogout as DirectHandleLogout } from './handle-logout.tsx';
import { HandleLogout, LoggedInUserContainer } from './index.tsx';
import { LoggedInUserContainer as DirectLoggedInUserContainer } from './logged-in-user.container.tsx';

describe('header exports', () => {
	it('re-exports the public header members', () => {
		expect(HandleLogout).toBe(DirectHandleLogout);
		expect(LoggedInUserContainer).toBe(DirectLoggedInUserContainer);
	});
});
