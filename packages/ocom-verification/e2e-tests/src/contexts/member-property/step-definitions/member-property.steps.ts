import { AfterAll, Given, Then, When } from '@cucumber/cucumber';
import { actorCalled, actorInTheSpotlight } from '@serenity-js/core';
import { closeMemberPropertyPortalSessions } from '../abilities/member-property-portal-page.ts';
import { OpenMemberPropertyDetail } from '../interactions/open-member-property-detail.ts';
import {
	IsRedirectedToAdminPropertyDirectory,
	MemberPropertyDetailHidesForeignOwnerIdentity,
	MemberPropertyDetailIsReadOnly,
	MemberPropertyDirectoryIncludes,
	MemberPropertyListingFlagEquals,
	MemberPropertyOperationSucceeds,
	MemberPropertyRouteIsDenied,
} from '../questions/member-property-screen.ts';
import { ArrangeForeignMemberProperty, ArrangeOwnMemberProperty, MakeForeignMemberAvailable } from '../tasks/arrange-member-property.ts';
import { EstablishMemberPropertyCommunity } from '../tasks/establish-member-property-community.ts';
import { BecomeMemberPropertyManager, BecomeMemberPropertyRouteVisitor, type MemberPropertyRouteVisitor } from '../tasks/member-property-personas.ts';
import { CreateMemberPropertyViaForm, UpdateMemberPropertyListingFlagViaForm, ViewMemberPropertyDirectory } from '../tasks/member-property-route.ts';

const visitors: ReadonlySet<MemberPropertyRouteVisitor> = new Set(['no-permission', 'no-role', 'nonaccepted', 'guest', 'mismatched-route']);

Given('Maya is an accepted own-property member in a member Property community', async () => {
	await actorCalled('Maya').attemptsTo(EstablishMemberPropertyCommunity.forOwnPropertyMember());
});

Given('a foreign same-community member owns the member Property {string}', async (propertyName: string) => {
	await actorCalled('Maya').attemptsTo(MakeForeignMemberAvailable(), ArrangeForeignMemberProperty(propertyName));
});

Given('Maya owns the member Property {string}', async (propertyName: string) => {
	await actorCalled('Maya').attemptsTo(ArrangeOwnMemberProperty(propertyName));
});

Given("{word} is a {string} member Property route visitor in Maya's community", async (actorName: string, visitorName: string) => {
	if (!visitors.has(visitorName as MemberPropertyRouteVisitor)) {
		throw new Error(`Unknown member Property route visitor "${visitorName}"`);
	}
	await actorCalled(actorName).attemptsTo(BecomeMemberPropertyRouteVisitor.inMayaCommunity(visitorName as MemberPropertyRouteVisitor, actorCalled('Maya')));
});

Given("Morgan is the property manager of Maya's member Property community", async () => {
	await actorCalled('Morgan').attemptsTo(BecomeMemberPropertyManager.inMayaCommunity(actorCalled('Maya')));
});

When('Maya opens the member Property directory', async () => {
	await actorCalled('Maya').attemptsTo(ViewMemberPropertyDirectory());
});

When('{word} opens their member Property directory', async (actorName: string) => {
	await actorCalled(actorName).attemptsTo(ViewMemberPropertyDirectory());
});

When('Maya creates a member Property named {string}', async (propertyName: string) => {
	await actorCalled('Maya').attemptsTo(CreateMemberPropertyViaForm(propertyName));
});

When('Maya opens the member Property details for {string}', async (propertyName: string) => {
	await actorCalled('Maya').attemptsTo(OpenMemberPropertyDetail(propertyName));
});

When('Maya sets the member Property {string} listing flag {string} to {string}', async (propertyName: string, flagName: string, value: string) => {
	if (flagName !== 'listedInDirectory') {
		throw new Error(`Unsupported member-editable listing flag "${flagName}"`);
	}
	if (value !== 'true' && value !== 'false') {
		throw new Error(`Expected a boolean member listing flag value, but received "${value}"`);
	}
	await actorCalled('Maya').attemptsTo(UpdateMemberPropertyListingFlagViaForm(propertyName, value === 'true'));
});

Then('the member Property directory includes {string}', async (propertyName: string) => {
	await actorInTheSpotlight().answer(MemberPropertyDirectoryIncludes(propertyName));
});

Then('the member Property operation succeeds', async () => {
	await actorInTheSpotlight().answer(MemberPropertyOperationSucceeds());
});

Then('the member Property detail is read-only', async () => {
	await actorInTheSpotlight().answer(MemberPropertyDetailIsReadOnly());
});

Then('the member Property detail does not display the foreign owner identity', async () => {
	await actorInTheSpotlight().answer(MemberPropertyDetailHidesForeignOwnerIdentity());
});

Then('the member Property {string} has listing flag {string} set to {string}', async (propertyName: string, flagName: string, value: string) => {
	await actorInTheSpotlight().answer(MemberPropertyListingFlagEquals(propertyName, flagName, value));
});

Then('{word} is denied the member Property route', async (actorName: string) => {
	await actorCalled(actorName).answer(MemberPropertyRouteIsDenied());
});

Then('Morgan is redirected to the admin Property directory', async () => {
	await actorCalled('Morgan').answer(IsRedirectedToAdminPropertyDirectory());
});

AfterAll(async () => {
	await closeMemberPropertyPortalSessions();
});
