import { Render, RenderInDom } from '@cellix/serenity-framework/dom/render-in-dom';
import { DomPageAdapter } from '@cellix/serenity-framework/pages/dom';
import { TaskStep } from '@cellix/serenity-framework/serenity';
import { StaffUserDetailPage, StaffUsersListPage } from '@ocom-verification/verification-shared/pages';
import { type Actor, Task, type UsesAbilities } from '@serenity-js/core';
import { act } from '@testing-library/react';
import React from 'react';
import { useLocation } from 'react-router-dom';
import { StaffUsersPage } from '../../../../../../ocom/ui-staff-route-user-management/src/pages/staff-users.tsx';
import { wrapOcomComponent } from '../../../shared/ocom-component-wrapper.ts';
import { currentStaffAuth, recordCurrentMockPath } from '../../staff-role/abilities/mock-staff-role-backend.ts';

export async function flushUi(): Promise<void> {
	await act(async () => {
		await new Promise((resolve) => setTimeout(resolve, 0));
	});
}

export async function waitUntilUi(check: () => Promise<boolean>, message: string, attempts = 200): Promise<void> {
	for (let attempt = 0; attempt < attempts; attempt++) {
		if (await check()) {
			return;
		}
		await flushUi();
	}
	throw new Error(message);
}

export const listPageFor = (actor: UsesAbilities): StaffUsersListPage => new StaffUsersListPage(new DomPageAdapter(RenderInDom.as(actor).container));

export const detailPageFor = (actor: UsesAbilities): StaffUserDetailPage => new StaffUserDetailPage(new DomPageAdapter(RenderInDom.as(actor).container));

const LocationProbe: React.FC = () => {
	const location = useLocation();
	recordCurrentMockPath(location.pathname);
	return null;
};

export const RenderStaffUsersScreen = (initialEntries: string[] = ['/']): Task =>
	Task.where(
		'#actor opens the staff users screen',
		new TaskStep<Actor>('#actor renders the staff users page', async (actor) => {
			await actor.attemptsTo(
				Render.component(React.createElement(React.Fragment, null, React.createElement(LocationProbe), React.createElement(StaffUsersPage)), {
					wrapper: wrapOcomComponent({ initialEntries, staffAuth: currentStaffAuth() }),
				}),
			);
			await flushUi();
		}),
	);
