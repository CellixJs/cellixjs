import { PlaywrightPageAdapter } from '@cellix/serenity-framework/pages/playwright';
import { BrowseTheWeb } from '@cellix/serenity-framework/serenity/browser';
import { MemberAccountsPage, MemberCreatePage, MemberListPage, MemberProfilePage } from '@ocom-verification/verification-shared/pages';
import type { Actor } from '@serenity-js/core';
import type { Page } from 'playwright';

export const communityPortalPageOf = (actor: Actor): Page => BrowseTheWeb.withActor(actor).page;

export const memberCreatePageOn = (page: Page): MemberCreatePage => new MemberCreatePage(new PlaywrightPageAdapter(page));

export const memberListPageOn = (page: Page): MemberListPage => new MemberListPage(new PlaywrightPageAdapter(page));

export const memberProfilePageOn = (page: Page): MemberProfilePage => new MemberProfilePage(new PlaywrightPageAdapter(page));

export const memberAccountsPageOn = (page: Page): MemberAccountsPage => new MemberAccountsPage(new PlaywrightPageAdapter(page));

/** Navigate to a community member list and wait for its search control to render. */
export const openMemberListFor = async (page: Page, communityId: string, routeMemberId: string): Promise<MemberListPage> => {
	await page.goto(`/community/${encodeURIComponent(communityId)}/admin/${encodeURIComponent(routeMemberId)}/members`, { waitUntil: 'networkidle' });
	const memberListPage = memberListPageOn(page);
	await memberListPage.searchInput.waitFor({ state: 'visible', timeout: 15_000 });
	return memberListPage;
};

/** Navigate to a community member create form and wait for its name input. */
export const openMemberCreateFormFor = async (page: Page, communityId: string, routeMemberId: string): Promise<MemberCreatePage> => {
	await page.goto(`/community/${encodeURIComponent(communityId)}/admin/${encodeURIComponent(routeMemberId)}/members/create`, { waitUntil: 'networkidle' });
	const memberCreatePage = memberCreatePageOn(page);
	await memberCreatePage.memberNameInput.waitFor({ state: 'visible', timeout: 15_000 });
	return memberCreatePage;
};

/** Navigate to a member profile and open its editor. */
export const openMemberProfileEditorFor = async (page: Page, communityId: string, routeMemberId: string, memberId: string): Promise<MemberProfilePage> => {
	await page.goto(`/community/${encodeURIComponent(communityId)}/admin/${encodeURIComponent(routeMemberId)}/members/${encodeURIComponent(memberId)}/profile`, { waitUntil: 'networkidle' });
	const memberProfilePage = memberProfilePageOn(page);
	await memberProfilePage.clickEditProfile();
	return memberProfilePage;
};

/** Navigate to a member account-assignment form and wait for its end-user selector. */
export const openMemberAccountAssignmentFor = async (page: Page, communityId: string, routeMemberId: string, memberId: string): Promise<MemberAccountsPage> => {
	await page.goto(`/community/${encodeURIComponent(communityId)}/admin/${encodeURIComponent(routeMemberId)}/members/${encodeURIComponent(memberId)}/accounts/add`, { waitUntil: 'networkidle' });
	const memberAccountsPage = memberAccountsPageOn(page);
	await memberAccountsPage.endUserSelect.waitFor({ state: 'visible', timeout: 15_000 });
	return memberAccountsPage;
};

/** Navigate to a member account list and wait for the account table to render. */
export const openMemberAccountsListFor = async (page: Page, communityId: string, routeMemberId: string, memberId: string): Promise<MemberAccountsPage> => {
	await page.goto(`/community/${encodeURIComponent(communityId)}/admin/${encodeURIComponent(routeMemberId)}/members/${encodeURIComponent(memberId)}/accounts`, { waitUntil: 'networkidle' });
	const memberAccountsPage = memberAccountsPageOn(page);
	await memberAccountsPage.addAccountButton.waitFor({ state: 'visible', timeout: 15_000 });
	return memberAccountsPage;
};
