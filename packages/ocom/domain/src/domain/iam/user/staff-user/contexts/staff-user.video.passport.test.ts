import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import type { StaffUserEntityReference } from '../../../../contexts/user/staff-user/staff-user.ts';
import type { VideoEntityReference } from '../../../../contexts/video/video/index.ts';
import type { VideoVisa } from '../../../../contexts/video/video.visa.ts';
import type { VideoViewingEntityReference } from '../../../../contexts/video/video-viewing/index.ts';
import { StaffUserVideoPassport } from './staff-user.video.passport.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/staff-user.video.passport.feature'));

const video = { id: 'video-1', community: { id: 'community-7' } } as VideoEntityReference;
const viewing = { id: 'viewing-1', videoId: 'video-1', memberId: 'member-1' } as unknown as VideoViewingEntityReference;

function makeStaffUser(canEncodeVideos: boolean | undefined) {
	return {
		id: 'staff-1',
		role: canEncodeVideos === undefined ? undefined : { permissions: { techAdminPermissions: { canEncodeVideos } } },
	} as unknown as StaffUserEntityReference;
}

test.for(feature, ({ Scenario }) => {
	let user: StaffUserEntityReference;
	let visa: VideoVisa;

	Scenario('Getting a visa for a video', ({ Given, When, Then, And }) => {
		Given('a staff user whose role has canEncodeVideos true', () => {
			user = makeStaffUser(true);
		});
		When("I get the passport's visa for a video", () => {
			visa = new StaffUserVideoPassport(user).forVideo(video);
		});
		Then('the visa should grant canEncodeVideos', () => {
			expect(visa.determineIf((permissions) => permissions.canEncodeVideos)).toBe(true);
		});
		And('the visa should not grant canManageVideos', () => {
			expect(visa.determineIf((permissions) => permissions.canManageVideos)).toBe(false);
		});
	});

	Scenario('Getting a visa for a video viewing', ({ Given, When, Then }) => {
		Given('a staff user whose role has canEncodeVideos true', () => {
			user = makeStaffUser(true);
		});
		When("I get the passport's visa for a video viewing", () => {
			visa = new StaffUserVideoPassport(user).forVideoViewing(viewing);
		});
		Then('the visa should not grant isOwnVideoViewing', () => {
			expect(visa.determineIf((permissions) => permissions.isOwnVideoViewing)).toBe(false);
		});
	});

	Scenario('Getting a visa for a staff user without a role', ({ Given, When, Then }) => {
		Given('a staff user with no role', () => {
			user = makeStaffUser(undefined);
		});
		When("I get the passport's visa for a video", () => {
			visa = new StaffUserVideoPassport(user).forVideo(video);
		});
		Then('the visa should not grant canEncodeVideos', () => {
			expect(visa.determineIf((permissions) => permissions.canEncodeVideos)).toBe(false);
		});
	});
});
