import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import type { MemberEntityReference } from '../../../contexts/community/member/index.ts';
import type { VideoEntityReference } from '../../../contexts/video/video/index.ts';
import type { VideoDomainPermissions } from '../../../contexts/video/video.domain-permissions.ts';
import { MemberVideoVisa } from './member.video.visa.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/member.video.visa.feature'));

function makeMember(communityId: string, canManageSiteContent: boolean) {
	return {
		id: 'member-1',
		community: { id: communityId },
		role: { permissions: { communityPermissions: { canManageSiteContent } } },
	} as unknown as MemberEntityReference;
}

test.for(feature, ({ Scenario, Background }) => {
	let video: VideoEntityReference;
	let member: MemberEntityReference;
	let permissions: VideoDomainPermissions | undefined;
	let result: boolean;

	const check = () => {
		new MemberVideoVisa(video, member).determineIf((granted) => {
			permissions = granted;
			return true;
		});
	};

	Background(({ Given }) => {
		Given('a VideoEntityReference in community "community-1"', () => {
			video = { id: 'video-1', community: { id: 'community-1' } } as VideoEntityReference;
			permissions = undefined;
		});
	});

	Scenario('A member who can manage site content can manage and view videos', ({ Given, When, Then, And }) => {
		Given('a member of community "community-1" whose role can manage site content', () => {
			member = makeMember('community-1', true);
		});
		When('I create a MemberVideoVisa and check the permissions', check);
		Then('canManageVideos should be true', () => {
			expect(permissions?.canManageVideos).toBe(true);
		});
		And('canViewVideos should be true', () => {
			expect(permissions?.canViewVideos).toBe(true);
		});
		And('isSystemAccount should be false', () => {
			expect(permissions?.isSystemAccount).toBe(false);
		});
	});

	Scenario('A member who cannot manage site content can only view videos', ({ Given, When, Then, And }) => {
		Given('a member of community "community-1" whose role cannot manage site content', () => {
			member = makeMember('community-1', false);
		});
		When('I create a MemberVideoVisa and check the permissions', check);
		Then('canManageVideos should be false', () => {
			expect(permissions?.canManageVideos).toBe(false);
		});
		And('canViewVideos should be true', () => {
			expect(permissions?.canViewVideos).toBe(true);
		});
	});

	Scenario('A member of another community is denied', ({ Given, When, Then }) => {
		Given('a member of community "community-2" whose role can manage site content', () => {
			member = makeMember('community-2', true);
		});
		When('I create a MemberVideoVisa and call determineIf with a function that returns true', () => {
			result = new MemberVideoVisa(video, member).determineIf(() => true);
		});
		Then('the result should be false', () => {
			expect(result).toBe(false);
		});
	});
});
