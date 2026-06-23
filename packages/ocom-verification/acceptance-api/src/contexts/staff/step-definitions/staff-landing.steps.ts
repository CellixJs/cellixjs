import { Given, Then, When } from '@cucumber/cucumber';
import { actors } from '@ocom-verification/verification-shared/test-data';
import { actorCalled, notes } from '@serenity-js/core';
import { resolveActorName } from '../../../shared/support/domain-test-helpers.ts';

type StaffBusinessRole = 'finance' | 'tech admin' | 'service line owner' | 'case manager';

interface StaffApiNotes {
	targetRoute: string;
}

const defaultRouteByRole: Record<StaffBusinessRole, string> = {
	finance: '/staff/finance',
	'tech admin': '/staff/tech',
	'service line owner': '/staff/community-management',
	'case manager': '/staff/community-management',
};

const actorRoles = new Map<string, StaffBusinessRole>();

let lastActorName = actors.StaffUser.name;

const normalizeRole = (roleName: string): StaffBusinessRole => {
	const normalized = roleName.trim().toLowerCase();

	if (normalized === 'finance' || normalized === 'tech admin' || normalized === 'service line owner' || normalized === 'case manager') {
		return normalized;
	}

	throw new Error(`Unsupported staff role "${roleName}"`);
};

const roleForActor = (actorName: string): StaffBusinessRole => actorRoles.get(actorName) ?? 'case manager';

const resolveFinanceWorkspaceRoute = (role: StaffBusinessRole): string => (role === 'finance' || role === 'tech admin' ? '/staff/finance' : '/unauthorized');

Given('{word} is an authenticated staff user', async (actorName: string) => {
	lastActorName = actorName;
	const actor = actorCalled(actorName);
	actorRoles.set(actorName, 'case manager');
	await actor.attemptsTo(notes<StaffApiNotes>().set('targetRoute', ''));
});

Given('{word} is an authenticated {string} staff user', async (actorName: string, roleName: string) => {
	lastActorName = actorName;
	const role = normalizeRole(roleName);
	const actor = actorCalled(actorName);
	actorRoles.set(actorName, role);
	await actor.attemptsTo(notes<StaffApiNotes>().set('targetRoute', ''));
});

When('{word} enters the staff operations workspace', async (actorName: string) => {
	lastActorName = actorName;
	const actor = actorCalled(actorName);
	await actor.attemptsTo(notes<StaffApiNotes>().set('targetRoute', defaultRouteByRole[roleForActor(actorName)]));
});

When('{word} attempts to work in the finance workspace', async (actorName: string) => {
	lastActorName = actorName;
	const actor = actorCalled(actorName);
	await actor.attemptsTo(notes<StaffApiNotes>().set('targetRoute', resolveFinanceWorkspaceRoute(roleForActor(actorName))));
});

Then('{word} should be directed to {string}', async (actorName: string, expectedRoute: string) => {
	const actor = actorCalled(resolveActorName(actorName, lastActorName));
	const actualRoute = await actor.answer(notes<StaffApiNotes>().get('targetRoute'));

	if (actualRoute !== expectedRoute) {
		throw new Error(`Expected route "${expectedRoute}", but got "${actualRoute}"`);
	}
});
