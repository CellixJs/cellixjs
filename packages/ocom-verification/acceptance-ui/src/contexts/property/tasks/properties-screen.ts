import { Render, RenderInDom } from '@cellix/serenity-framework/dom/render-in-dom';
import { DomPageAdapter } from '@cellix/serenity-framework/pages/dom';
import { TaskStep } from '@cellix/serenity-framework/serenity';
import { PropertiesListPage, PropertyFormPage } from '@ocom-verification/verification-shared/pages';
import { type Actor, Task, type UsesAbilities } from '@serenity-js/core';
import { act } from '@testing-library/react';
import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { Properties } from '../../../../../../ocom/ui-community-route-admin/src/pages/properties.tsx';
import { wrapOcomComponent } from '../../../shared/ocom-component-wrapper.ts';
import { buildPropertyMocks, PROPERTIES_BASE_PATH } from '../abilities/mock-property-backend.ts';

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

/** Properties list page object scoped to the actor's rendered container. */
export const listPageFor = (actor: UsesAbilities): PropertiesListPage => new PropertiesListPage(new DomPageAdapter(RenderInDom.as(actor).container));

/** Property form page object scoped to the actor's rendered container. */
export const formPageFor = (actor: UsesAbilities): PropertyFormPage => new PropertyFormPage(new DomPageAdapter(RenderInDom.as(actor).container));

/** antd messages and modals portal to document.body, outside the container. */
export const feedbackPage = (): PropertyFormPage => new PropertyFormPage(new DomPageAdapter(document.body));

/**
 * Task that renders the admin properties section at the given router entries
 * with the mocked property backend. The section is mounted at its real admin
 * route so route params and the permission guard behave like production.
 */
export const RenderPropertiesScreen = (initialEntries: string[] = [PROPERTIES_BASE_PATH]): Task =>
	Task.where(
		'#actor opens the admin properties screen',
		new TaskStep<Actor>('#actor renders the admin properties section', async (actor) => {
			await actor.attemptsTo(
				Render.component(
					React.createElement(
						Routes,
						null,
						React.createElement(Route, {
							path: '/community/:communityId/admin/:memberId/properties/*',
							element: React.createElement(Properties),
						}),
					),
					{
						wrapper: wrapOcomComponent({ mocks: buildPropertyMocks(), initialEntries }),
					},
				),
			);
			await flushUi();
		}),
	);

/** Task that renders the properties list and waits for it to load. */
export const OpenPropertiesList = (): Task =>
	Task.where(
		'#actor views the properties list',
		new TaskStep<Actor>('#actor waits for the properties list to render', async (actor) => {
			await actor.attemptsTo(RenderPropertiesScreen());
			const listPage = listPageFor(actor);
			await waitUntilUi(() => listPage.heading.isVisible(), 'Expected the properties list to render');
		}),
	);

/** Task that opens the detail form for a property and waits for it to load. */
export const OpenPropertyDetail = (propertyName: string): Task =>
	Task.where(
		`#actor opens the details of the property "${propertyName}"`,
		new TaskStep<Actor>(`#actor navigates to the details of "${propertyName}"`, async (actor) => {
			await actor.attemptsTo(OpenPropertiesList());
			const listPage = listPageFor(actor);
			await waitUntilUi(async () => (await listPage.listedPropertyNames()).length > 0, 'Expected the properties list to render rows');
			await listPage.clickViewForProperty(propertyName);
			const formPage = formPageFor(actor);
			await waitUntilUi(async () => (await formPage.propertyNameValue()) === propertyName, `Expected the detail form to load the property "${propertyName}"`);
		}),
	);
