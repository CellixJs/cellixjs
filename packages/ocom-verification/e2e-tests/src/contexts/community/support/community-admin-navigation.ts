import type { Page } from 'playwright';

interface CommunityAdminRoute {
	communityId: string;
	memberId: string;
}

const communityAdminUrlPattern = /\/community\/([^/]+)\/admin\/([^/?#]+)/;

const parseCommunityAdminRoute = (url: string): CommunityAdminRoute => {
	const matched = url.match(communityAdminUrlPattern);
	if (!matched) {
		throw new Error(`Expected admin route URL, but got "${url}"`);
	}

	return {
		communityId: matched[1] ?? '',
		memberId: matched[2] ?? '',
	};
};

const communityTableRow = (page: Page, communityName: string) =>
	page
		.getByRole('row', {
			name: new RegExp(communityName, 'i'),
		})
		.first();

const openAdminPortalFromCommunityRow = async (page: Page, communityName: string): Promise<void> => {
	const row = communityTableRow(page, communityName);
	await row.waitFor({ state: 'visible', timeout: 15_000 });

	await row.getByRole('button', { name: /Admin Portals/i }).click();

	const visibleDropdown = page.locator('.ant-dropdown:visible').last();
	await visibleDropdown.waitFor({ state: 'visible', timeout: 10_000 });

	await visibleDropdown
		.getByRole('button')
		.first()
		.click()
		.catch(async () => {
			await visibleDropdown.getByRole('menuitem').first().click();
		});
};

const openCommunityAdminPortal = async (page: Page, communityName: string): Promise<CommunityAdminRoute> => {
	await page.goto('/community/accounts', { waitUntil: 'networkidle' });
	await openAdminPortalFromCommunityRow(page, communityName);

	await page.waitForURL(/\/community\/[^/]+\/admin\/[^/?#]+(?:\/)?(?:\?.*)?$/, { timeout: 15_000 });
	return parseCommunityAdminRoute(page.url());
};

export const gotoCommunityMembersCreatePage = async (page: Page, communityName: string): Promise<CommunityAdminRoute> => {
	const route = await openCommunityAdminPortal(page, communityName);
	await page.goto(`/community/${route.communityId}/admin/${route.memberId}/members/create`, {
		waitUntil: 'networkidle',
	});

	return route;
};

export const gotoCommunityMembersListPage = async (page: Page, communityName: string): Promise<CommunityAdminRoute> => {
	const route = await openCommunityAdminPortal(page, communityName);
	await page.goto(`/community/${route.communityId}/admin/${route.memberId}/members`, {
		waitUntil: 'networkidle',
	});

	return route;
};
