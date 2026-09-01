import { Render, RenderInDom } from '@cellix/serenity-framework/dom/render-in-dom';
import { DomPageAdapter } from '@cellix/serenity-framework/pages/dom';
import { TaskStep } from '@cellix/serenity-framework/serenity';
import { Member } from '@ocom/ui-community-route-member';
import { MemberPropertiesListPage, MemberPropertyReadOnlyDetailPage, PropertyFormPage } from '@ocom-verification/verification-shared/pages';
import { type Actor, notes, Task, type UsesAbilities } from '@serenity-js/core';
import React from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { wrapOcomComponent } from '../../../shared/ocom-component-wrapper.ts';
import { buildMemberPropertyMocks, type MemberPropertyUiVisitor, memberPropertyRouteFor } from '../abilities/mock-member-property-backend.ts';
import type { MemberPropertyUiNotes } from '../notes/member-property-ui-notes.ts';

const ROUTE_PATH_SELECTOR = '.member-property-current-route';

const CurrentRoute: React.FC = () => {
	const location = useLocation();
	return <output className="member-property-current-route">{location.pathname}</output>;
};

export const memberListPageFor = (actor: UsesAbilities): MemberPropertiesListPage => new MemberPropertiesListPage(new DomPageAdapter(RenderInDom.as(actor).container));

export const memberReadOnlyDetailPageFor = (actor: UsesAbilities): MemberPropertyReadOnlyDetailPage => new MemberPropertyReadOnlyDetailPage(new DomPageAdapter(RenderInDom.as(actor).container));

const memberPropertyFormPageFor = (actor: UsesAbilities): PropertyFormPage => new PropertyFormPage(new DomPageAdapter(RenderInDom.as(actor).container));

export const memberPropertyCurrentRouteFor = (actor: UsesAbilities) => new DomPageAdapter(RenderInDom.as(actor).container).locator(ROUTE_PATH_SELECTOR);

const pause = (): Promise<void> => new Promise<void>((resolve) => setTimeout(resolve, 10));

type RouteContentPredicate = (adapter: DomPageAdapter) => Promise<boolean>;

const isVisible = async (predicate: () => Promise<boolean>): Promise<boolean> => predicate().catch(() => false);

const directoryIsVisible: RouteContentPredicate = (adapter) => isVisible(() => adapter.getByText(/Community Properties \(/).isVisible());
const deniedResultIsVisible: RouteContentPredicate = (adapter) => isVisible(() => adapter.locator('.member-property-route-forbidden').isVisible());
const propertyFormIsVisible: RouteContentPredicate = (adapter) => isVisible(() => adapter.getByLabel('Property Name').isVisible());
const propertyDetailIsVisible: RouteContentPredicate = async (adapter) =>
	(await isVisible(() => adapter.locator('.property-read-only-detail').isVisible())) || (await isVisible(() => adapter.locator('form').isVisible())) || (await isVisible(() => adapter.getByText('Property Not Found').isVisible()));

const waitForMemberRoute = async (actor: Actor, matchesRoute: (route: string) => boolean, hasExpectedContent: RouteContentPredicate): Promise<void> => {
	for (let attempt = 0; attempt < 100; attempt += 1) {
		const route = (await memberPropertyCurrentRouteFor(actor).textContent()) ?? '';
		if (matchesRoute(route) && (await hasExpectedContent(new DomPageAdapter(RenderInDom.as(actor).container)))) {
			return;
		}
		await pause();
	}
	throw new Error('The member Property route did not settle after navigation.');
};

const waitForRouteResolution = async (actor: Actor): Promise<void> => {
	await waitForMemberRoute(
		actor,
		(route) => !route.includes('/member/') || route.endsWith('/properties'),
		async (adapter) => (await directoryIsVisible(adapter)) || (await deniedResultIsVisible(adapter)) || !((await memberPropertyCurrentRouteFor(actor).textContent()) ?? '').includes('/member/'),
	);
};

export const PrepareMemberPropertyVisitor = (visitor: MemberPropertyUiVisitor): Task =>
	Task.where(
		`#actor becomes a ${visitor} member Property route visitor`,
		new TaskStep<Actor>('#actor records the member Property route visitor', async (actor) => {
			const route = memberPropertyRouteFor(visitor);
			await actor.attemptsTo(notes<MemberPropertyUiNotes>().set('visitor', visitor), notes<MemberPropertyUiNotes>().set('memberPropertyRoute', route));
		}),
	);

const RenderMemberPropertyRoute = (): Task =>
	Task.where(
		'#actor renders the member Property route',
		new TaskStep<Actor>('#actor mounts the member Property route boundary', async (actor) => {
			const route = await actor.answer(notes<MemberPropertyUiNotes>().get('memberPropertyRoute'));
			await actor.attemptsTo(
				Render.component(
					React.createElement(
						React.Fragment,
						null,
						React.createElement(
							Routes,
							null,
							React.createElement(Route, {
								path: '/community/:communityId/member/:memberId/*',
								element: React.createElement(Member),
							}),
							React.createElement(Route, {
								path: '*',
								element: React.createElement('div', { role: 'status' }, 'Member Property route redirected'),
							}),
						),
						React.createElement(CurrentRoute),
					),
					{ wrapper: wrapOcomComponent({ mocks: buildMemberPropertyMocks(), initialEntries: [route] }) },
				),
			);
			await waitForRouteResolution(actor);
		}),
	);

export const OpenMemberPropertyDirectory = (): Task => Task.where('#actor opens the member Property directory', RenderMemberPropertyRoute());

export const OpenMemberPropertyDetail = (propertyName: string): Task =>
	Task.where(
		`#actor opens the member Property details for "${propertyName}"`,
		OpenMemberPropertyDirectory(),
		new TaskStep<Actor>('#actor selects the member Property details action', async (actor) => {
			await memberListPageFor(actor).clickViewForProperty(propertyName);
			await waitForMemberRoute(actor, (route) => /\/properties\/[^/]+$/.test(route), propertyDetailIsVisible);
		}),
	);

export const CreateMemberPropertyViaForm = (propertyName: string): Task =>
	Task.where(
		`#actor creates the member Property "${propertyName}"`,
		OpenMemberPropertyDirectory(),
		new TaskStep<Actor>('#actor submits the member Property create form', async (actor) => {
			const list = memberListPageFor(actor);
			await list.clickAddProperty();
			await waitForMemberRoute(actor, (route) => route.endsWith('/properties/create'), propertyFormIsVisible);
			const form = memberPropertyFormPageFor(actor);
			await form.fillPropertyName(propertyName);
			await form.clickCreate();
			await waitForMemberRoute(actor, (route) => route.endsWith('/properties'), directoryIsVisible);
		}),
	);

export const UpdateMemberPropertyListingFlagViaForm = (propertyName: string, value: boolean): Task =>
	Task.where(
		`#actor updates ${propertyName} in the member Property form`,
		OpenMemberPropertyDetail(propertyName),
		new TaskStep<Actor>('#actor saves the member-editable listing flag', async (actor) => {
			const form = memberPropertyFormPageFor(actor);
			await form.setListingFlag('listedInDirectory', value);
			await form.clickSave();
			await pause();
		}),
	);
