import { PlaywrightPageAdapter } from '@cellix/serenity-framework/pages/playwright';
import { MemberPropertiesListPage, MemberPropertyReadOnlyDetailPage, PropertyFormPage } from '@ocom-verification/verification-shared/pages';
import { actors } from '@ocom-verification/verification-shared/test-data';
import { type AnswersQuestions, notes, type UsesAbilities } from '@serenity-js/core';
import type { BrowserContext, Page } from 'playwright';
import { infrastructure } from '../../../infrastructure.ts';
import { performOAuth2Login } from '../../../shared/abilities/oauth2-login.ts';
import type { MemberPropertyBrowserVisitor, MemberPropertyE2ENotes } from '../notes/member-property-notes.ts';

interface PortalCredentials {
	email: string;
	password: string;
}

interface MemberPropertyPortalSession {
	context: BrowserContext;
	page: Page;
	authenticated: boolean;
}

const credentialsFor = (visitor: MemberPropertyBrowserVisitor): PortalCredentials | undefined => {
	switch (visitor) {
		case 'own-editor':
		case 'mismatched-route':
			return { email: actors.CommunityMember.email, password: 'password' };
		case 'manager':
			return { email: actors.CommunityOwner.email, password: 'password' };
		case 'no-permission':
		case 'no-role':
		case 'nonaccepted':
			return { email: actors.OtherCommunityOwner.email, password: 'password' };
		case 'guest':
			return undefined;
	}
};

const sessions = new Map<MemberPropertyBrowserVisitor, MemberPropertyPortalSession>();

/** Returns an isolated community-portal page for the requested member fixture identity. */
async function memberPropertyPortalPageFor(visitor: MemberPropertyBrowserVisitor): Promise<Page> {
	let session = sessions.get(visitor);
	if (!session) {
		const context = await infrastructure.newPortalContext('community');
		session = { context, page: await context.newPage(), authenticated: false };
		sessions.set(visitor, session);
	}
	const credentials = credentialsFor(visitor);
	if (credentials && !session.authenticated) {
		await performOAuth2Login(session.page, credentials, '/community/accounts');
		session.authenticated = true;
	}
	return session.page;
}

/** Closes all isolated member Property browser contexts created by the suite. */
export async function closeMemberPropertyPortalSessions(): Promise<void> {
	for (const session of sessions.values()) {
		await session.context.close().catch(() => undefined);
	}
	sessions.clear();
}

export const memberPropertyPortalPageOf = async (actor: AnswersQuestions): Promise<Page> => {
	const visitor = await actor.answer(notes<MemberPropertyE2ENotes>().get('visitor'));
	return await memberPropertyPortalPageFor(visitor);
};

export const memberPropertiesListOn = (page: Page): MemberPropertiesListPage => new MemberPropertiesListPage(new PlaywrightPageAdapter(page));

export const memberPropertyReadOnlyDetailOn = (page: Page): MemberPropertyReadOnlyDetailPage => new MemberPropertyReadOnlyDetailPage(new PlaywrightPageAdapter(page));

export const memberPropertyFormOn = (page: Page): PropertyFormPage => new PropertyFormPage(new PlaywrightPageAdapter(page));

export async function memberBasePathOf(actor: AnswersQuestions & UsesAbilities): Promise<string> {
	const basePath = await actor.answer(notes<MemberPropertyE2ENotes>().get('memberBasePath'));
	if (!basePath) {
		throw new Error('No member Property base path was recorded. Did the member Property setup run?');
	}
	return basePath;
}

export async function adminBasePathOfMemberProperty(actor: AnswersQuestions & UsesAbilities): Promise<string> {
	const basePath = await actor.answer(notes<MemberPropertyE2ENotes>().get('adminBasePath'));
	if (!basePath) {
		throw new Error('No admin Property base path was recorded. Did the member Property setup run?');
	}
	return basePath;
}

export const memberPropertyRouteDiagnostic = async (page: Page): Promise<string> => {
	const body = await page
		.locator('body')
		.textContent()
		.catch(() => null);
	return `url=${page.url()}; body=${body?.replace(/\s+/g, ' ').trim().slice(0, 400) ?? ''}`;
};
