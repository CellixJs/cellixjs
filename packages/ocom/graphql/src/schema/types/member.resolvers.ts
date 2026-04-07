import type { GraphQLResolveInfo } from 'graphql';
import type { GraphContext } from '../context.ts';
import type {
	Resolvers,
	MutationActivateMemberArgs,
	MutationDeactivateMemberArgs,
	MutationRemoveMemberArgs,
	MutationBulkActivateMembersArgs,
	MutationBulkDeactivateMembersArgs,
	MutationBulkRemoveMembersArgs,
	MutationInviteMemberArgs,
	MutationBulkInviteMembersArgs,
	MutationActivateMembersBulkArgs,
	MutationDeactivateMembersBulkArgs,
	MutationRemoveMembersBulkArgs,
	MutationInviteMembersBulkArgs,
	MutationMemberRoleUpdateArgs,
} from '../builder/generated.ts';
import type { DeactivateMemberCommand, RemoveMemberCommand, BulkDeactivateMembersCommand, BulkRemoveMembersCommand } from '../../../../application-services/src/contexts/community/member/member-management.js';
import type { MemberInvitationEntityReference } from '../../../../domain/src/domain/contexts/community/member/member-invitation.js';

const toGraphQLInvitation = (inv: MemberInvitationEntityReference) => ({
	id: inv.id,
	email: inv.email,
	message: inv.message,
	status: inv.status,
	expiresAt: inv.expiresAt,
	communityId: inv.communityId,
	createdAt: inv.createdAt,
	updatedAt: inv.updatedAt,
	invitedBy: inv.invitedBy,
	acceptedBy: inv.acceptedBy ?? null,
});

const member: Resolvers = {
	MemberInvitation: {
		invitedBy: async (parent, _args: unknown, context: GraphContext, _info: GraphQLResolveInfo) => {
			const user = await context.applicationServices.User.EndUser.queryById({
				id: parent.invitedBy.id,
			});
			if (!user) throw new Error('Invited by user not found');
			return user;
		},
		acceptedBy: async (parent, _args: unknown, context: GraphContext, _info: GraphQLResolveInfo) => {
			if (!parent.acceptedBy?.id) {
				return null;
			}
			return await context.applicationServices.User.EndUser.queryById({
				id: parent.acceptedBy.id,
			});
		},
	},
	Member: {
		community: async (parent, _args: unknown, context: GraphContext, _info: GraphQLResolveInfo) => {
			return await context.applicationServices.Community.Community.queryById({
				id: parent.communityId,
			});
		},

		// role: async (parent, _args: unknown, _context: GraphContext, _info: GraphQLResolveInfo) => {
		//     return await parent.loadRole();
		// },
		isAdmin: async (parent, _args: unknown, context: GraphContext, _info: GraphQLResolveInfo) => {
			return await context.applicationServices.Community.Member.determineIfAdmin({
				memberId: parent.id,
			});
		},
	},
	MemberAccount: {
		user: async (parent, _args: unknown, context: GraphContext, _info: GraphQLResolveInfo) => {
			if (!parent.user?.id) {
				return null;
			}
			return await context.applicationServices.User.EndUser.queryById({
				id: parent.user?.id,
			});
		},
	},
	Query: {
		membersForCurrentEndUser: async (_parent, _args: unknown, context: GraphContext, _info: GraphQLResolveInfo) => {
			if (!context.applicationServices.verifiedUser?.verifiedJwt) {
				throw new Error('Unauthorized');
			}
			const externalId = context.applicationServices.verifiedUser.verifiedJwt.sub;
			return await context.applicationServices.Community.Member.queryByEndUserExternalId({
				externalId,
			});
		},
		membersByCommunityId: async (_parent, args: { communityId: string }, context: GraphContext, _info: GraphQLResolveInfo) => {
			if (!context.applicationServices.verifiedUser?.verifiedJwt) {
				throw new Error('Unauthorized');
			}
			return await context.applicationServices.Community.Member.queryByCommunityId({
				communityId: args.communityId,
			});
		},
	},
	Mutation: {
		activateMember: async (_parent, args: MutationActivateMemberArgs, context: GraphContext, _info: GraphQLResolveInfo) => {
			try {
				if (!context.applicationServices.verifiedUser?.verifiedJwt) {
					return {
						status: {
							success: false,
							errorMessage: 'Unauthorized',
						},
					};
				}

				const result = await context.applicationServices.Community.Member.activateMember({
					memberId: args.input.memberId,
				});

				return {
					status: {
						success: true,
					},
					member: result,
				};
			} catch (error) {
				return {
					status: {
						success: false,
						errorMessage: error instanceof Error ? error.message : 'Unknown error',
					},
				};
			}
		},
		deactivateMember: async (_parent, args: MutationDeactivateMemberArgs, context: GraphContext, _info: GraphQLResolveInfo) => {
			try {
				if (!context.applicationServices.verifiedUser?.verifiedJwt) {
					return {
						status: {
							success: false,
							errorMessage: 'Unauthorized',
						},
					};
				}

				const command: DeactivateMemberCommand = {
					memberId: args.input.memberId,
				};

				if (args.input.reason) {
					command.reason = args.input.reason;
				}

				const result = await context.applicationServices.Community.Member.deactivateMember(command);

				return {
					status: {
						success: true,
					},
					member: result,
				};
			} catch (error) {
				return {
					status: {
						success: false,
						errorMessage: error instanceof Error ? error.message : 'Unknown error',
					},
				};
			}
		},
		removeMember: async (_parent, args: MutationRemoveMemberArgs, context: GraphContext, _info: GraphQLResolveInfo) => {
			try {
				if (!context.applicationServices.verifiedUser?.verifiedJwt) {
					return {
						status: {
							success: false,
							errorMessage: 'Unauthorized',
						},
					};
				}

				const command: RemoveMemberCommand = {
					memberId: args.input.memberId,
				};

				if (args.input.reason) {
					command.reason = args.input.reason;
				}

				await context.applicationServices.Community.Member.removeMember(command);

				// Since removeMember returns void, we can't return the member
				// The client will need to refetch or update cache manually
				return {
					status: {
						success: true,
					},
					member: null,
				};
			} catch (error) {
				return {
					status: {
						success: false,
						errorMessage: error instanceof Error ? error.message : 'Unknown error',
					},
				};
			}
		},
		bulkActivateMembers: async (_parent, args: MutationBulkActivateMembersArgs, context: GraphContext, _info: GraphQLResolveInfo) => {
			try {
				if (!context.applicationServices.verifiedUser?.verifiedJwt) {
					return {
						status: {
							success: false,
							errorMessage: 'Unauthorized',
						},
					};
				}

				const members = await context.applicationServices.Community.Member.bulkActivateMembers({
					memberIds: [...args.input.memberIds], // Convert readonly to mutable array
				});

				return {
					status: {
						success: true,
					},
					members: members,
					successCount: members.length,
					failedCount: args.input.memberIds.length - members.length,
				};
			} catch (error) {
				return {
					status: {
						success: false,
						errorMessage: error instanceof Error ? error.message : 'Unknown error',
					},
				};
			}
		},
		bulkDeactivateMembers: async (_parent, args: MutationBulkDeactivateMembersArgs, context: GraphContext, _info: GraphQLResolveInfo) => {
			try {
				if (!context.applicationServices.verifiedUser?.verifiedJwt) {
					return {
						status: {
							success: false,
							errorMessage: 'Unauthorized',
						},
					};
				}

				const command: BulkDeactivateMembersCommand = {
					memberIds: [...args.input.memberIds], // Convert readonly to mutable array
				};

				if (args.input.reason) {
					command.reason = args.input.reason;
				}

				const members = await context.applicationServices.Community.Member.bulkDeactivateMembers(command);

				return {
					status: {
						success: true,
					},
					members: members,
					successCount: members.length,
					failedCount: args.input.memberIds.length - members.length,
				};
			} catch (error) {
				return {
					status: {
						success: false,
						errorMessage: error instanceof Error ? error.message : 'Unknown error',
					},
				};
			}
		},
		bulkRemoveMembers: async (_parent, args: MutationBulkRemoveMembersArgs, context: GraphContext, _info: GraphQLResolveInfo) => {
			try {
				if (!context.applicationServices.verifiedUser?.verifiedJwt) {
					return {
						status: {
							success: false,
							errorMessage: 'Unauthorized',
						},
					};
				}

				const command: BulkRemoveMembersCommand = {
					memberIds: [...args.input.memberIds], // Convert readonly to mutable array
				};

				if (args.input.reason) {
					command.reason = args.input.reason;
				}

				await context.applicationServices.Community.Member.bulkRemoveMembers(command);

				// Since bulkRemoveMembers returns void, we return empty members array
				return {
					status: {
						success: true,
					},
					members: [],
					successCount: args.input.memberIds.length, // Assume all succeeded since no error was thrown
					failedCount: 0,
				};
			} catch (error) {
				return {
					status: {
						success: false,
						errorMessage: error instanceof Error ? error.message : 'Unknown error',
					},
				};
			}
		},

		// Member Invitation Mutations
		inviteMember: async (_parent, args: MutationInviteMemberArgs, context: GraphContext, _info: GraphQLResolveInfo) => {
			try {
				if (!context.applicationServices.verifiedUser?.verifiedJwt) {
					return {
						status: {
							success: false,
							errorMessage: 'Unauthorized',
						},
					};
				}

				const invitation = await context.applicationServices.Community.Member.inviteMember({
					communityId: args.input.communityId,
					email: args.input.email,
					...(args.input.message != null ? { message: args.input.message } : {}),
					...(args.input.expiresInDays != null ? { expiresInDays: args.input.expiresInDays } : {}),
					invitedByExternalId: context.applicationServices.verifiedUser.verifiedJwt.sub,
				});

				return {
					status: {
						success: true,
					},
					invitation: toGraphQLInvitation(invitation),
				};
			} catch (error) {
				return {
					status: {
						success: false,
						errorMessage: error instanceof Error ? error.message : 'Unknown error',
					},
				};
			}
		},

		bulkInviteMembers: async (_parent, args: MutationBulkInviteMembersArgs, context: GraphContext, _info: GraphQLResolveInfo) => {
			try {
				if (!context.applicationServices.verifiedUser?.verifiedJwt) {
					return {
						status: {
							success: false,
							errorMessage: 'Unauthorized',
						},
						invitations: [],
						successCount: 0,
						failedCount: args.input.invitations.length,
					};
				}

				const invitations = await context.applicationServices.Community.Member.bulkInviteMembers({
					communityId: args.input.communityId,
					invitations: args.input.invitations.map((inv) => ({
						email: inv.email,
						...(inv.message != null ? { message: inv.message } : {}),
					})),
					...(args.input.expiresInDays != null ? { expiresInDays: args.input.expiresInDays } : {}),
					invitedByExternalId: context.applicationServices.verifiedUser.verifiedJwt.sub,
				});

				const failedCount = args.input.invitations.length - invitations.length;

				return {
					status: {
						success: true,
					},
					invitations: invitations.map(toGraphQLInvitation),
					successCount: invitations.length,
					failedCount,
				};
			} catch (error) {
				return {
					status: {
						success: false,
						errorMessage: error instanceof Error ? error.message : 'Unknown error',
					},
					invitations: [],
					successCount: 0,
					failedCount: args.input.invitations.length,
				};
			}
		},

		// Additional bulk operations for the new mutation names

		activateMembersBulk(_parent: unknown, args: MutationActivateMembersBulkArgs, context: GraphContext) {
			try {
				// Validate authentication and permissions (same as activateMembers)
				if (!context.applicationServices.verifiedUser?.verifiedJwt?.sub) {
					throw new Error('User not authenticated');
				}

				return {
					status: {
						success: false,
						errorMessage: 'Activate members bulk functionality not yet implemented',
					},
					results: args.input.memberIds.map((memberId) => ({
						memberId,
						success: false,
						errorMessage: 'Not implemented',
					})),
				};
			} catch (error: unknown) {
				return {
					status: {
						success: false,
						errorMessage: error instanceof Error ? error.message : 'Failed to activate members',
					},
					results: [],
				};
			}
		},

		deactivateMembersBulk(_parent: unknown, args: MutationDeactivateMembersBulkArgs, context: GraphContext) {
			try {
				// Validate authentication and permissions
				if (!context.applicationServices.verifiedUser?.verifiedJwt?.sub) {
					throw new Error('User not authenticated');
				}

				return {
					status: {
						success: false,
						errorMessage: 'Deactivate members bulk functionality not yet implemented',
					},
					results: args.input.memberIds.map((memberId) => ({
						memberId,
						success: false,
						errorMessage: 'Not implemented',
					})),
				};
			} catch (error: unknown) {
				return {
					status: {
						success: false,
						errorMessage: error instanceof Error ? error.message : 'Failed to deactivate members',
					},
					results: [],
				};
			}
		},

		removeMembersBulk(_parent: unknown, args: MutationRemoveMembersBulkArgs, context: GraphContext) {
			try {
				// Validate authentication and permissions
				if (!context.applicationServices.verifiedUser?.verifiedJwt?.sub) {
					throw new Error('User not authenticated');
				}

				return {
					status: {
						success: false,
						errorMessage: 'Remove members bulk functionality not yet implemented',
					},
					results: args.input.memberIds.map((memberId) => ({
						memberId,
						success: false,
						errorMessage: 'Not implemented',
					})),
				};
			} catch (error: unknown) {
				return {
					status: {
						success: false,
						errorMessage: error instanceof Error ? error.message : 'Failed to remove members',
					},
					results: [],
				};
			}
		},

		inviteMembersBulk(_parent: unknown, args: MutationInviteMembersBulkArgs, _context: GraphContext) {
			try {
				// TODO: Implement bulk member invitation
				// This is a placeholder implementation for UI completeness
				const { emails } = args.input;

				return {
					status: {
						success: false,
						errorMessage: 'Bulk member invitation functionality not yet implemented',
					},
					results: emails.map((email: string) => ({
						email,
						success: false,
						errorMessage: 'Not implemented',
					})),
				};
			} catch (error: unknown) {
				return {
					status: {
						success: false,
						errorMessage: error instanceof Error ? error.message : 'Failed to invite members',
					},
					results: [],
				};
			}
		},

		memberRoleUpdate: async (_parent: unknown, args: MutationMemberRoleUpdateArgs, context: GraphContext) => {
			try {
				// Validate authentication
				if (!context.applicationServices.verifiedUser?.verifiedJwt) {
					return {
						status: {
							success: false,
							errorMessage: 'Unauthorized',
						},
						member: null,
					};
				}

				const { memberId, roleId, reason } = args.input;

				// Call the application service to update the member role
				const result = await context.applicationServices.Community.Member.updateMemberRole({
					memberId,
					roleId,
					reason,
				});

				return {
					status: {
						success: true,
					},
					member: result,
				};
			} catch (error: unknown) {
				return {
					status: {
						success: false,
						errorMessage: error instanceof Error ? error.message : 'Failed to update member role',
					},
					member: null,
				};
			}
		},
	},
};

export default member;
