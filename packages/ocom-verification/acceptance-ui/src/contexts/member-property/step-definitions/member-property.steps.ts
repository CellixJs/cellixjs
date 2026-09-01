import { Given, Then, When } from '@cucumber/cucumber';
import { actorCalled, actorInTheSpotlight } from '@serenity-js/core';
import {
	ensureForeignMemberProperty,
	ensureOwnMemberProperty,
	MEMBER_PROPERTY_ADMIN_BASE_PATH,
	MEMBER_PROPERTY_FOREIGN_OWNER_NAME,
	type MemberPropertyUiVisitor,
	memberPropertyMockRecord,
	resetMemberPropertyUiState,
	useMemberPropertyUiVisitor,
} from '../abilities/mock-member-property-backend.ts';
import {
	ForeignOwnerIdentityIsVisible,
	MemberPropertyCurrentRoute,
	MemberPropertyDetailIsReadOnly,
	MemberPropertyDirectoryNames,
	MemberPropertyDirectoryRendered,
	MemberPropertyRouteDenied,
} from '../questions/member-property-screen.ts';
import { CreateMemberPropertyViaForm, OpenMemberPropertyDetail, OpenMemberPropertyDirectory, PrepareMemberPropertyVisitor, UpdateMemberPropertyListingFlagViaForm } from '../tasks/member-property-screen.tsx';

let lastActorName = 'Maya';

const routeVisitor = (visitor: string): MemberPropertyUiVisitor => {
	const visitors: Record<string, MemberPropertyUiVisitor> = {
		'no-permission': 'no-permission',
		'no-role': 'no-role',
		nonaccepted: 'nonaccepted',
		guest: 'guest',
		'mismatched-route': 'mismatched-route',
	};
	const resolved = visitors[visitor];
	if (!resolved) {
		throw new Error(`Unsupported member Property route visitor "${visitor}"`);
	}
	return resolved;
};

Given('{word} is an accepted own-property member in a member Property community', async (actorName: string) => {
	lastActorName = actorName;
	resetMemberPropertyUiState();
	useMemberPropertyUiVisitor('own-editor');
	await actorCalled(actorName).attemptsTo(PrepareMemberPropertyVisitor('own-editor'));
});

Given('a foreign same-community member owns the member Property {string}', (propertyName: string) => {
	ensureForeignMemberProperty(propertyName);
});

Given('{word} owns the member Property {string}', (_actorName: string, propertyName: string) => {
	ensureOwnMemberProperty(propertyName);
});

Given("{word} is a {string} member Property route visitor in Maya's community", async (actorName: string, visitor: string) => {
	lastActorName = actorName;
	const routePersona = routeVisitor(visitor);
	useMemberPropertyUiVisitor(routePersona);
	await actorCalled(actorName).attemptsTo(PrepareMemberPropertyVisitor(routePersona));
});

Given("{word} is the property manager of Maya's member Property community", async (actorName: string) => {
	lastActorName = actorName;
	useMemberPropertyUiVisitor('manager');
	await actorCalled(actorName).attemptsTo(PrepareMemberPropertyVisitor('manager'));
});

When('{word} opens the member Property directory', async (actorName: string) => {
	lastActorName = actorName;
	await actorCalled(actorName).attemptsTo(OpenMemberPropertyDirectory());
});

When('{word} opens their member Property directory', async (actorName: string) => {
	lastActorName = actorName;
	await actorCalled(actorName).attemptsTo(OpenMemberPropertyDirectory());
});

When('{word} opens the member Property details for {string}', async (actorName: string, propertyName: string) => {
	lastActorName = actorName;
	await actorCalled(actorName).attemptsTo(OpenMemberPropertyDetail(propertyName));
});

When('{word} creates a member Property named {string}', async (actorName: string, propertyName: string) => {
	lastActorName = actorName;
	await actorCalled(actorName).attemptsTo(CreateMemberPropertyViaForm(propertyName));
});

When('{word} sets the member Property {string} listing flag {string} to {string}', async (actorName: string, propertyName: string, flag: string, value: string) => {
	if (flag !== 'listedInDirectory' || (value !== 'true' && value !== 'false')) {
		throw new Error(`Unsupported member Property UI listing update ${flag}=${value}`);
	}
	lastActorName = actorName;
	await actorCalled(actorName).attemptsTo(UpdateMemberPropertyListingFlagViaForm(propertyName, value === 'true'));
});

Then('the member Property operation succeeds', async () => {
	if (!(await actorCalled(lastActorName).answer(MemberPropertyDirectoryRendered()))) {
		throw new Error('Expected the member Property operation to succeed, but the member Property route did not render');
	}
});

Then('the member Property directory includes {string}', async (propertyName: string) => {
	const names = await actorCalled(lastActorName).answer(MemberPropertyDirectoryNames());
	if (!names.includes(propertyName)) {
		throw new Error(`Expected the member Property directory to include "${propertyName}", but it listed: ${names.join(', ') || 'none'}`);
	}
});

Then('the member Property detail is read-only', async () => {
	if (!(await actorInTheSpotlight().answer(MemberPropertyDetailIsReadOnly()))) {
		throw new Error('Expected the foreign member Property detail to render as read-only');
	}
});

Then('the member Property detail does not display the foreign owner identity', async () => {
	if (await actorInTheSpotlight().answer(ForeignOwnerIdentityIsVisible(MEMBER_PROPERTY_FOREIGN_OWNER_NAME))) {
		throw new Error(`Expected the foreign owner identity "${MEMBER_PROPERTY_FOREIGN_OWNER_NAME}" to be hidden from the member detail`);
	}
});

Then('the member Property {string} has listing flag {string} set to {string}', (propertyName: string, flag: string, expectedValue: string) => {
	if (flag !== 'listedInDirectory') {
		throw new Error(`Unsupported member Property UI flag "${flag}"`);
	}
	const property = memberPropertyMockRecord(propertyName);
	if (!property || property.listedInDirectory !== (expectedValue === 'true')) {
		throw new Error(`Expected "${propertyName}" to persist ${flag}=${expectedValue}`);
	}
});

Then('{word} is denied the member Property route', async (actorName: string) => {
	if (!(await actorCalled(actorName).answer(MemberPropertyRouteDenied()))) {
		throw new Error(`Expected ${actorName} to see the member Property access-denied result`);
	}
});

Then('{word} is redirected to the admin Property directory', async (actorName: string) => {
	const currentRoute = await actorCalled(actorName).answer(MemberPropertyCurrentRoute());
	if (currentRoute !== MEMBER_PROPERTY_ADMIN_BASE_PATH) {
		throw new Error(`Expected ${actorName} to be redirected to "${MEMBER_PROPERTY_ADMIN_BASE_PATH}", but the member route remained at "${currentRoute}"`);
	}
});
