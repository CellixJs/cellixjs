import { actors, END_USER_IDS } from '@ocom-verification/verification-shared/test-data';
import { Ability, type Actor } from '@serenity-js/core';
import { mongooseTestServer } from '../../servers/mongoose-test-server.ts';

/** Identifiers of the arranged resident member and its end-user role. */
interface ResidentMemberIds {
	roleId: string;
	memberId: string;
}

/** Handler that provisions a resident member (no property permissions) in a community. */
type ProvisionResidentMemberHandler = (actor: Actor, communityId: string) => Promise<ResidentMemberIds>;

const RESIDENT_ROLE_NAME = 'Resident';
const RESIDENT_MEMBER_NAME = 'Resident Member';

/**
 * Arrangement-only Serenity ability that inserts an EndUserRole with all
 * property permissions denied plus a Member for the seeded CommunityMember end
 * user directly into MongoDB. No GraphQL mutation creates non-admin end-user
 * roles today, so negative property scenarios arrange their unauthorized
 * principal here, mirroring the verification-shared seed upsert style.
 */
export class ProvisionResidentMember extends Ability {
	constructor(private readonly handler: ProvisionResidentMemberHandler) {
		super();
	}

	static using(handler: ProvisionResidentMemberHandler): ProvisionResidentMember {
		return new ProvisionResidentMember(handler);
	}

	async performAs(actor: Actor, communityId: string): Promise<ResidentMemberIds> {
		return await this.handler(actor, communityId);
	}
}

export function provisionResidentMemberAbility(): ProvisionResidentMember {
	return ProvisionResidentMember.using(async (_actor, communityId) => {
		const mongoose = mongooseTestServer.getService().service;
		const { ObjectId } = mongoose.Types;
		const { connection } = mongoose;
		const now = new Date();
		const communityObjectId = new ObjectId(communityId);
		const endUserObjectId = new ObjectId(END_USER_IDS.communityMember);

		const roleDocument = {
			roleType: 'end-user-roles',
			community: communityObjectId,
			roleName: RESIDENT_ROLE_NAME,
			isDefault: false,
			permissions: {
				servicePermissions: { canManageServices: false },
				serviceTicketPermissions: {
					canCreateTickets: false,
					canManageTickets: false,
					canAssignTickets: false,
					canWorkOnTickets: false,
				},
				violationTicketPermissions: {
					canCreateTickets: false,
					canManageTickets: false,
					canAssignTickets: false,
					canWorkOnTickets: false,
				},
				communityPermissions: {
					canManageRolesAndPermissions: false,
					canManageCommunitySettings: false,
					canManageSiteContent: false,
					canManageMembers: false,
					canEditOwnMemberProfile: false,
					canEditOwnMemberAccounts: false,
				},
				propertyPermissions: {
					canManageProperties: false,
					canEditOwnProperty: false,
				},
			},
			schemaVersion: '1.0.0',
			createdAt: now,
			updatedAt: now,
		};

		const role = await connection.collection('roles').findOneAndReplace({ roleType: 'end-user-roles', community: communityObjectId, roleName: RESIDENT_ROLE_NAME }, roleDocument, { upsert: true, returnDocument: 'after' });
		if (!role?._id) {
			throw new Error(`Could not provision the "${RESIDENT_ROLE_NAME}" end-user role for community ${communityId}`);
		}

		const memberDocument = {
			memberName: RESIDENT_MEMBER_NAME,
			community: communityObjectId,
			role: role._id,
			accounts: [
				{
					_id: new ObjectId(),
					firstName: actors.CommunityMember.givenName,
					lastName: actors.CommunityMember.familyName,
					user: endUserObjectId,
					statusCode: 'ACCEPTED',
					createdBy: endUserObjectId,
					createdAt: now,
					updatedAt: now,
				},
			],
			customViews: [],
			profile: {
				interests: [],
				showInterests: false,
				showEmail: false,
				showProfile: false,
				showLocation: false,
				showProperties: false,
			},
			schemaVersion: '1.0.0',
			createdAt: now,
			updatedAt: now,
		};

		const member = await connection.collection('members').findOneAndReplace({ community: communityObjectId, memberName: RESIDENT_MEMBER_NAME }, memberDocument, { upsert: true, returnDocument: 'after' });
		if (!member?._id) {
			throw new Error(`Could not provision the "${RESIDENT_MEMBER_NAME}" member for community ${communityId}`);
		}

		return {
			roleId: String(role._id),
			memberId: String(member._id),
		};
	});
}
