import { actors, type TestActor } from '../test-actors.ts';
import { STAFF_ROLE_IDS } from './staff-roles.ts';

export interface StaffUserSeedDocument {
	_id: string;
	userType: 'staff-user';
	externalId: string;
	displayName: string;
	firstName: string;
	lastName: string;
	email: string;
	role: string;
	accessBlocked: boolean;
	tags: string[];
	activityLog: never[];
	schemaVersion: string;
	createdAt: Date;
	updatedAt: Date;
}

export const STAFF_USER_IDS = {
	staffUser: 'c00000000000000000000001',
	techAdminStaff: 'c00000000000000000000002',
	caseManagerStaff: 'c00000000000000000000003',
} as const;

export const staffUsers: StaffUserSeedDocument[] = [
	createStaffUserSeedDocument(STAFF_USER_IDS.staffUser, actors.StaffUser, STAFF_ROLE_IDS.seededCaseManager),
	createStaffUserSeedDocument(STAFF_USER_IDS.techAdminStaff, actors.TechAdminStaff, STAFF_ROLE_IDS.seededTechAdmin),
	createStaffUserSeedDocument(STAFF_USER_IDS.caseManagerStaff, actors.CaseManagerStaff, STAFF_ROLE_IDS.seededCaseManager),
];

function createStaffUserSeedDocument(id: string, actor: TestActor, roleId: string): StaffUserSeedDocument {
	return {
		_id: id,
		userType: 'staff-user',
		externalId: actor.externalId,
		displayName: `${actor.givenName} ${actor.familyName}`.trim(),
		firstName: actor.givenName,
		lastName: actor.familyName,
		email: actor.email,
		role: roleId,
		accessBlocked: false,
		tags: [],
		activityLog: [],
		schemaVersion: '1.0.0',
		createdAt: new Date('2024-01-01T00:00:00Z'),
		updatedAt: new Date('2024-01-01T00:00:00Z'),
	};
}
