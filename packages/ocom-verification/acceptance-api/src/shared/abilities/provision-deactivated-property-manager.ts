import { actors, END_USER_IDS } from '@ocom-verification/verification-shared/test-data';
import { Ability, type Actor } from '@serenity-js/core';
import { mongooseTestServer } from '../../servers/mongoose-test-server.ts';

/** Identifiers of the arranged deactivated property manager and its end-user role. */
interface DeactivatedPropertyManagerIds {
	roleId: string;
	memberId: string;
}

/** Handler that provisions a deactivated property manager (rejected account, manager role) in a community. */
type ProvisionDeactivatedPropertyManagerHandler = (actor: Actor, communityId: string) => Promise<DeactivatedPropertyManagerIds>;

const MANAGER_ROLE_NAME = 'Deactivated Property Manager';
const MANAGER_MEMBER_NAME = 'Deactivated Manager Member';

/**
 * Arrangement-only Serenity ability that inserts an EndUserRole granting
 * property management plus a Member whose account for the seeded
 * OtherCommunityOwner end user is REJECTED (deactivated) directly into
 * MongoDB. No GraphQL mutation arranges this principal today, so deactivation
 * scenarios provision it here, mirroring the resident-member arrangement.
 */
export class ProvisionDeactivatedPropertyManager extends Ability {
	constructor(private readonly handler: ProvisionDeactivatedPropertyManagerHandler) {
		super();
	}

	static using(handler: ProvisionDeactivatedPropertyManagerHandler): ProvisionDeactivatedPropertyManager {
		return new ProvisionDeactivatedPropertyManager(handler);
	}

	async performAs(actor: Actor, communityId: string): Promise<DeactivatedPropertyManagerIds> {
		return await this.handler(actor, communityId);
	}
}

export function provisionDeactivatedPropertyManagerAbility(): ProvisionDeactivatedPropertyManager {
	return ProvisionDeactivatedPropertyManager.using(async (_actor, communityId) => {
		const mongoose = mongooseTestServer.getService().service;
		const { ObjectId } = mongoose.Types;
		const { connection } = mongoose;
		const now = new Date();
		const communityObjectId = new ObjectId(communityId);
		const endUserObjectId = new ObjectId(END_USER_IDS.otherCommunityOwner);

		const roleDocument = {
			roleType: 'end-user-roles',
			community: communityObjectId,
			roleName: MANAGER_ROLE_NAME,
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
					canManageProperties: true,
					canEditOwnProperty: true,
				},
			},
			schemaVersion: '1.0.0',
			createdAt: now,
			updatedAt: now,
		};

		const role = await connection.collection('roles').findOneAndReplace({ roleType: 'end-user-roles', community: communityObjectId, roleName: MANAGER_ROLE_NAME }, roleDocument, { upsert: true, returnDocument: 'after' });
		if (!role?._id) {
			throw new Error(`Could not provision the "${MANAGER_ROLE_NAME}" end-user role for community ${communityId}`);
		}

		const memberDocument = {
			memberName: MANAGER_MEMBER_NAME,
			community: communityObjectId,
			role: role._id,
			accounts: [
				{
					_id: new ObjectId(),
					firstName: actors.OtherCommunityOwner.givenName,
					lastName: actors.OtherCommunityOwner.familyName,
					user: endUserObjectId,
					// REJECTED marks the account as deactivated; the visa must deny property access.
					statusCode: 'REJECTED',
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

		const member = await connection.collection('members').findOneAndReplace({ community: communityObjectId, memberName: MANAGER_MEMBER_NAME }, memberDocument, { upsert: true, returnDocument: 'after' });
		if (!member?._id) {
			throw new Error(`Could not provision the "${MANAGER_MEMBER_NAME}" member for community ${communityId}`);
		}

		return {
			roleId: String(role._id),
			memberId: String(member._id),
		};
	});
}
