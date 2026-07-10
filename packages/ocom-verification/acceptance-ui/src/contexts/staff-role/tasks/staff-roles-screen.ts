import { Render, RenderInDom } from '@cellix/serenity-framework/dom/render-in-dom';
import { DomPageAdapter } from '@cellix/serenity-framework/pages/dom';
import { TaskStep } from '@cellix/serenity-framework/serenity';
import { StaffRoleFormPage, StaffRolesListPage } from '@ocom-verification/verification-shared/pages';
import { type Actor, Task } from '@serenity-js/core';
import { act } from '@testing-library/react';
import React from 'react';
import { useLocation } from 'react-router-dom';
import { StaffRolesPage } from '../../../../../../ocom/ui-staff-route-user-management/src/pages/staff-roles.tsx';
import { wrapOcomComponent } from '../../../shared/ocom-component-wrapper.ts';
import { buildStaffRoleMocks, currentStaffAuth, recordCurrentMockPath } from '../abilities/mock-staff-role-backend.ts';

/** Let pending React work (async form handlers, Apollo mocks) settle. */
export async function flushUi(): Promise<void> {
	await act(async () => {
		await new Promise((resolve) => setTimeout(resolve, 0));
	});
}

/** Poll a DOM condition, flushing React work between attempts. */
export async function waitUntilUi(check: () => Promise<boolean>, message: string, attempts = 200): Promise<void> {
	for (let attempt = 0; attempt < attempts; attempt++) {
		if (await check()) {
			return;
		}
		await flushUi();
	}
	throw new Error(message);
}

/** Staff roles list page object scoped to the actor's rendered container. */
export const listPageFor = (actor: Actor): StaffRolesListPage => new StaffRolesListPage(new DomPageAdapter(RenderInDom.as(actor).container));

/** Staff role form page object scoped to the actor's rendered container. */
export const formPageFor = (actor: Actor): StaffRoleFormPage => new StaffRoleFormPage(new DomPageAdapter(RenderInDom.as(actor).container));

/** antd messages portal to document.body, outside the rendered container. */
export const feedbackPage = (): StaffRoleFormPage => new StaffRoleFormPage(new DomPageAdapter(document.body));

/** Reports the router path the rendered screen navigated to. */
const LocationProbe: React.FC = () => {
	const location = useLocation();
	recordCurrentMockPath(location.pathname);
	return null;
};

/**
 * Task that renders the staff roles screen at the given router entries with
 * the mocked staff-role backend and the current staff auth.
 */
export const RenderStaffRolesScreen = (initialEntries: string[] = ['/']): Task =>
	Task.where(
		'#actor opens the staff roles screen',
		new TaskStep<Actor>('#actor renders the staff roles page', async (actor) => {
			await actor.attemptsTo(
				Render.component(React.createElement(React.Fragment, null, React.createElement(LocationProbe), React.createElement(StaffRolesPage)), {
					wrapper: wrapOcomComponent({ mocks: buildStaffRoleMocks(), initialEntries, staffAuth: currentStaffAuth() }),
				}),
			);
			await flushUi();
		}),
	);

/** Task that renders the staff roles list and waits for its rows to appear. */
export const OpenStaffRolesList = (): Task =>
	Task.where(
		'#actor views the staff roles list',
		new TaskStep<Actor>('#actor waits for the staff roles list rows', async (actor) => {
			await actor.attemptsTo(RenderStaffRolesScreen());
			const listPage = listPageFor(actor);
			await waitUntilUi(async () => (await listPage.listedRoleNames()).length > 0, 'Expected the staff roles list to render rows');
		}),
	);

/** Task that opens the edit form for a staff role and waits for it to load. */
export const OpenEditFormForRole = (roleName: string): Task =>
	Task.where(
		`#actor opens the edit form for the staff role "${roleName}"`,
		new TaskStep<Actor>(`#actor navigates to the edit form of "${roleName}"`, async (actor) => {
			await actor.attemptsTo(OpenStaffRolesList());
			const listPage = listPageFor(actor);
			await listPage.clickEditForRole(roleName);
			const formPage = formPageFor(actor);
			await waitUntilUi(async () => (await formPage.roleNameValue()) === roleName, `Expected the edit form to load the staff role "${roleName}"`);
		}),
	);
