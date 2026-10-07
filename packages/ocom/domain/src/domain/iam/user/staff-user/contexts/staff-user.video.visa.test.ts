import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import type { StaffUserEntityReference } from '../../../../contexts/user/staff-user/staff-user.ts';
import type { VideoEntityReference } from '../../../../contexts/video/video/index.ts';
import type { VideoDomainPermissions } from '../../../../contexts/video/video.domain-permissions.ts';
import { StaffUserVideoVisa } from './staff-user.video.visa.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/staff-user.video.visa.feature'));

const video = { id: 'video-1', community: { id: 'community-7' } } as VideoEntityReference;

function makeStaffUser(canEncodeVideos: boolean | undefined) {
	return {
		id: 'staff-1',
		role: canEncodeVideos === undefined ? undefined : { permissions: { techAdminPermissions: { canEncodeVideos } } },
	} as unknown as StaffUserEntityReference;
}

test.for(feature, ({ Scenario }) => {
	let user: StaffUserEntityReference;
	let permissions: VideoDomainPermissions | undefined;

	const check = () => {
		new StaffUserVideoVisa(video, user).determineIf((granted) => {
			permissions = granted;
			return true;
		});
	};

	Scenario('A staff user whose role can encode videos', ({ Given, When, Then, And }) => {
		Given('a staff user whose role has canEncodeVideos true', () => {
			user = makeStaffUser(true);
		});
		When("I check the video permissions for any community's video", check);
		Then('canEncodeVideos and canViewVideos should be true', () => {
			expect([permissions?.canEncodeVideos, permissions?.canViewVideos]).toEqual([true, true]);
		});
		And('canManageVideos, isOwnVideoViewing, and isSystemAccount should be false', () => {
			expect([permissions?.canManageVideos, permissions?.isOwnVideoViewing, permissions?.isSystemAccount]).toEqual([false, false, false]);
		});
	});

	Scenario('A staff user whose role cannot encode videos', ({ Given, When, Then }) => {
		Given('a staff user whose role has canEncodeVideos false', () => {
			user = makeStaffUser(false);
		});
		When("I check the video permissions for any community's video", check);
		Then('canEncodeVideos and canViewVideos should be false', () => {
			expect([permissions?.canEncodeVideos, permissions?.canViewVideos]).toEqual([false, false]);
		});
	});

	Scenario('A staff user without a role', ({ Given, When, Then }) => {
		let result: boolean;
		Given('a staff user without a role', () => {
			user = makeStaffUser(undefined);
		});
		When('I call determineIf with a function that returns true', () => {
			result = new StaffUserVideoVisa(video, user).determineIf(() => true);
		});
		Then('the result should be false', () => {
			expect(result).toBe(false);
		});
	});
});
