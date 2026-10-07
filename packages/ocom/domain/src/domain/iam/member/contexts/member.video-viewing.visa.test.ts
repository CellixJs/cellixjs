import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import type { MemberEntityReference } from '../../../contexts/community/member/index.ts';
import type { VideoDomainPermissions } from '../../../contexts/video/video.domain-permissions.ts';
import type { VideoViewingEntityReference } from '../../../contexts/video/video-viewing/index.ts';
import { MemberVideoViewingVisa } from './member.video-viewing.visa.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/member.video-viewing.visa.feature'));

function makeMember(id: string, communityId: string, canManageSiteContent: boolean) {
	return {
		id,
		community: { id: communityId },
		role: { permissions: { communityPermissions: { canManageSiteContent } } },
	} as unknown as MemberEntityReference;
}

test.for(feature, ({ Scenario, Background }) => {
	let viewing: VideoViewingEntityReference;
	let member: MemberEntityReference;
	let permissions: VideoDomainPermissions | undefined;
	let result: boolean;

	const check = () => {
		new MemberVideoViewingVisa(viewing, member).determineIf((granted) => {
			permissions = granted;
			return true;
		});
	};

	Background(({ Given }) => {
		Given('a VideoViewingEntityReference in community "community-1" for member "member-1"', () => {
			viewing = { id: 'viewing-1', communityId: 'community-1', memberId: 'member-1' } as VideoViewingEntityReference;
			permissions = undefined;
		});
	});

	Scenario('A member looking at their own viewing', ({ Given, When, Then, And }) => {
		Given('member "member-1" of community "community-1" whose role cannot manage site content', () => {
			member = makeMember('member-1', 'community-1', false);
		});
		When('I create a MemberVideoViewingVisa and check the permissions', check);
		Then('isOwnVideoViewing should be true', () => {
			expect(permissions?.isOwnVideoViewing).toBe(true);
		});
		And('canViewVideos should be true', () => {
			expect(permissions?.canViewVideos).toBe(true);
		});
		And('canManageVideos should be false', () => {
			expect(permissions?.canManageVideos).toBe(false);
			expect(permissions?.canEncodeVideos).toBe(false);
			expect(permissions?.isSystemAccount).toBe(false);
		});
	});

	Scenario("A member who manages site content looking at another member's viewing", ({ Given, When, Then, And }) => {
		Given('member "member-2" of community "community-1" whose role can manage site content', () => {
			member = makeMember('member-2', 'community-1', true);
		});
		When('I create a MemberVideoViewingVisa and check the permissions', check);
		Then('isOwnVideoViewing should be false', () => {
			expect(permissions?.isOwnVideoViewing).toBe(false);
		});
		And('canManageVideos should be true', () => {
			expect(permissions?.canManageVideos).toBe(true);
		});
	});

	Scenario('A member of another community is denied', ({ Given, When, Then }) => {
		Given('member "member-1" of community "community-2" whose role can manage site content', () => {
			member = makeMember('member-1', 'community-2', true);
		});
		When('I create a MemberVideoViewingVisa and call determineIf with a function that returns true', () => {
			result = new MemberVideoViewingVisa(viewing, member).determineIf(() => true);
		});
		Then('the result should be false', () => {
			expect(result).toBe(false);
		});
	});
});
