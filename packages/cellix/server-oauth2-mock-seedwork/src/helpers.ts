import crypto from 'node:crypto';

type ProfileLike = {
	sub?: string;
	preferred_username?: string;
	email?: string;
	given_name?: string;
	family_name?: string;
	password?: unknown;
	name?: unknown;
	username?: unknown;
	[ k: string ]: unknown;
};

export function buildRedirectWithCode(redirectUri: string, code: string, state?: string): string {
	try {
		const redirectUrl = new URL(redirectUri);
		redirectUrl.searchParams.set('code', code);
		if (typeof state === 'string' && state.length <= 2048) redirectUrl.searchParams.set('state', state);
		return redirectUrl.toString();
	} catch {
		throw new Error('invalid_redirect_uri');
	}
}

export function buildEffectiveProfile(portalProfile: ProfileLike, userClaims?: Record<string, unknown>, sub?: string): Record<string, unknown> {
	const { sub: _ps, tid: _pt, ...portalExtras } = portalProfile ?? {};
	let merged: Record<string, unknown> = { ...portalExtras, ...(userClaims ?? {}) };
	// strip password if present
	if (Object.hasOwn(merged, 'password')) {
		const { password: _p, ...rest } = merged as Record<string, unknown>;
		merged = rest;
	}
	const finalSub = typeof sub === 'string' ? sub : (typeof portalProfile?.sub === 'string' ? portalProfile.sub : crypto.randomUUID());
	return { ...merged, sub: finalSub };
}

export function normalizeUserInfo(profile: ProfileLike): Record<string, unknown> {
	const p = { ...profile } as ProfileLike;
	const sub = typeof profile.sub === 'string' ? profile.sub : undefined;
	const preferred = typeof profile.preferred_username === 'string' ? profile.preferred_username : undefined;
	const email = typeof profile.email === 'string' ? profile.email : undefined;
	const username = preferred ?? (email?.includes('@') ? email.split('@')[0] : undefined) ?? sub;
	if (typeof username === 'string') p.username = username;
	if (!p.name) {
		const given = typeof profile.given_name === 'string' ? profile.given_name : undefined;
		const family = typeof profile.family_name === 'string' ? profile.family_name : undefined;
		if (given && family) p.name = `${given} ${family}`;
		else p.name = given ?? family ?? username;
	}
	return p;
}

export function extractClaimsFromPayload(payload: Record<string, unknown>): Record<string, unknown> {
	const { email: emailProp, given_name: givenNameProp, family_name: familyNameProp } = payload ?? {};
	const email = typeof emailProp === 'string' ? emailProp : undefined;
	const givenName = typeof givenNameProp === 'string' ? givenNameProp : undefined;
	const familyName = typeof familyNameProp === 'string' ? familyNameProp : undefined;
	return { ...(email ? { email } : {}), ...(givenName ? { given_name: givenName } : {}), ...(familyName ? { family_name: familyName } : {}) };
}

export function escapeHtml(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
}
