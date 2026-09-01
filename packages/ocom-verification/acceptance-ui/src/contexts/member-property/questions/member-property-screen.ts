import { type Actor, Question } from '@serenity-js/core';
import { memberListPageFor, memberPropertyCurrentRouteFor, memberReadOnlyDetailPageFor, OpenMemberPropertyDirectory } from '../tasks/member-property-screen.tsx';

export const MemberPropertyDirectoryRendered = () =>
	Question.about('whether the member Property directory rendered', async (actor) => {
		const page = memberListPageFor(actor);
		return (
			(await page.adapter.locator('.ant-table').isVisible()) ||
			(await memberReadOnlyDetailPageFor(actor)
				.adapter.getByText(/^Property Details$/)
				.isVisible()
				.catch(() => false))
		);
	});

export const MemberPropertyDirectoryNames = () =>
	Question.about('the visible member Property directory names', async (actor) => {
		await (actor as Actor).attemptsTo(OpenMemberPropertyDirectory());
		return await memberListPageFor(actor).listedPropertyNames();
	});

export const MemberPropertyDetailIsReadOnly = () =>
	Question.about('whether the member Property detail is read-only', async (actor) => {
		const detail = memberReadOnlyDetailPageFor(actor);
		return (await detail.heading.isVisible()) && !(await detail.hasEditableControls());
	});

export const ForeignOwnerIdentityIsVisible = (ownerName: string) =>
	Question.about(`whether the foreign owner identity "${ownerName}" is visible`, async (actor) => {
		return await memberReadOnlyDetailPageFor(actor).displaysOwnerIdentity(ownerName);
	});

export const MemberPropertyRouteDenied = () =>
	Question.about('whether the member Property route shows an access-denied result', async (actor) => {
		const currentRoute = (await memberPropertyCurrentRouteFor(actor).textContent()) ?? '';
		if (!currentRoute.includes('/member/')) return true;
		return await memberReadOnlyDetailPageFor(actor)
			.adapter.getByText(/access denied|forbidden|not authorized/i)
			.isVisible();
	});

export const MemberPropertyCurrentRoute = () => Question.about('the current member Property route', async (actor) => (await memberPropertyCurrentRouteFor(actor).textContent()) ?? '');
