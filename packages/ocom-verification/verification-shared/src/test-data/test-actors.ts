export interface TestActor {
	name: string;
	externalId: string;
	email: string;
	givenName: string;
	familyName: string;
	/** Entra enterprise app roles claim included in the actor's JWT (staff actors only). */
	roles?: string[];
}

const communityOwner: TestActor = {
	name: 'CommunityOwner',
	externalId: 'aaaaaaaa-bbbb-1ccc-9ddd-eeeeeeeeee01',
	email: 'owner@test.example',
	givenName: 'Test',
	familyName: 'Owner',
};

const communityMember: TestActor = {
	name: 'CommunityMember',
	externalId: 'aaaaaaaa-bbbb-1ccc-9ddd-eeeeeeeeee02',
	email: 'member@test.example',
	givenName: 'Test',
	familyName: 'Member',
};

const guest: TestActor = {
	name: 'Guest',
	externalId: '',
	email: '',
	givenName: 'Guest',
	familyName: '',
};

const staffUser: TestActor = {
	name: 'StaffUser',
	externalId: '10000000-0000-4000-8000-000000000001',
	email: 'staff@sharethrift.onmicrosoft.com',
	givenName: 'Staff',
	familyName: 'User',
	roles: ['Staff.CaseManager'],
};

const techAdminStaff: TestActor = {
	name: 'TechAdminStaff',
	externalId: '10000000-0000-4000-8000-000000000002',
	email: 'tech.admin@sharethrift.onmicrosoft.com',
	givenName: 'Tech',
	familyName: 'Admin',
	roles: ['Staff.TechAdmin'],
};

const caseManagerStaff: TestActor = {
	name: 'CaseManagerStaff',
	externalId: '10000000-0000-4000-8000-000000000003',
	email: 'case.manager@sharethrift.onmicrosoft.com',
	givenName: 'Case',
	familyName: 'Manager',
	roles: ['Staff.CaseManager'],
};

export const actors = {
	CommunityOwner: communityOwner,
	CommunityMember: communityMember,
	StaffUser: staffUser,
	TechAdminStaff: techAdminStaff,
	CaseManagerStaff: caseManagerStaff,
	Guest: guest,
} as const;

export function getActor(name: string): TestActor {
	const actor = actors[name as keyof typeof actors];
	if (!actor) {
		throw new Error(`Unknown test actor "${name}". Known actors: ${Object.keys(actors).join(', ')}`);
	}
	return actor;
}

export const defaultActor: TestActor = communityOwner;
