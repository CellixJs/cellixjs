import type { GraphQLResolveInfo } from 'graphql';
import type { GraphContext } from '../context.ts';
import type {
	Resolvers,
	MutationMemberCreateArgs,
	MutationMemberCreateAccountArgs,
	MutationMemberUpdateAccountArgs,
	MutationMemberRemoveAccountArgs,
	MutationActivateMemberArgs,
	MutationDeactivateMemberArgs,
	MutationRemoveMemberArgs,
	MutationBulkActivateMembersArgs,
	MutationBulkDeactivateMembersArgs,
	MutationBulkRemoveMembersArgs,
	MutationInviteMemberArgs,
	MutationBulkInviteMembersArgs,
	MutationMemberRoleUpdateArgs,
	MutationMemberUpdateProfileArgs,
} from '../builder/generated.ts';
import type {
	MemberCreateCommand,
	MemberCreateAccountCommand,
	MemberUpdateAccountCommand,
	MemberRemoveAccountCommand,
	MemberUpdateProfileCommand,
	DeactivateMemberCommand,
	RemoveMemberCommand,
	BulkDeactivateMembersCommand,
	BulkRemoveMembersCommand,
} from '../../../../application-services/src/contexts/community/member/member-management.js';
import type { MemberInvitationEntityReference } from '../../../../domain/src/domain/contexts/community/member/member-invitation.js';

/**
 * Resolves the acting user's member record in the given community.
 * Used to enforce self-protection guards on destructive mutations.
 */
const getActorMemberIdForCommunity = async (context: GraphContext, communityId?: string): Promise<string | null> => {
	if (!communityId) {
		return null;
	}

	const externalId = context.applicationServices.verifiedUser?.verifiedJwt?.sub;
	if (!externalId) {
		return null;
	}

	const queryByEndUserExternalId = context.applicationServices.Community.Member.queryByEndUserExternalId;
	if (typeof queryByEndUserExternalId !== 'function') {
		return null;
	}

	try {
		const members = await queryByEndUserExternalId({ externalId });
		const found = members.find((m) => String(m.communityId) === String(communityId));
		return found ? String(found.id) : null;
	} catch {
		return null;
	}
};

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

		role: (parent, _args: unknown, _context: GraphContext, _info: GraphQLResolveInfo) => {
			try {
				// biome-ignore lint/suspicious/noExplicitAny: GraphQL codegen type mismatch with domain types
				return (parent.role ?? null) as any;
			} catch {
				return null;
			}
		},
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
		member: async (_parent, args: { id: string }, context: GraphContext, _info: GraphQLResolveInfo) => {
			if (!context.applicationServices.verifiedUser?.verifiedJwt) {
				throw new Error('Unauthorized');
			}
			// We'll add a queryById application service method
			return await context.applicationServices.Community.Member.queryById({
				id: args.id,
			});
		},
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
		memberForCurrentCommunity: async (_parent: unknown, args: { communityId: string }, context: GraphContext, _info: GraphQLResolveInfo) => {
			if (!context.applicationServices.verifiedUser?.verifiedJwt) {
				throw new Error('Unauthorized');
			}
			const externalId = context.applicationServices.verifiedUser.verifiedJwt.sub;
			const members = await context.applicationServices.Community.Member.queryByEndUserExternalId({ externalId });
			return members.find((m) => String(m.communityId) === String(args.communityId)) ?? null;
		},
	},
	Mutation: {
		memberCreate: async (_parent, args: MutationMemberCreateArgs, context: GraphContext, _info: GraphQLResolveInfo) => {
			try {
				if (!context.applicationServices.verifiedUser?.verifiedJwt) {
					return {
						status: {
							success: false,
							errorMessage: 'Unauthorized',
						},
					};
				}

				const command: MemberCreateCommand = {
					memberName: args.input.memberName,
					communityId: context.applicationServices.verifiedUser?.hints?.communityId || '',
				};

				if (!command.communityId) {
					return {
						status: {
							success: false,
							errorMessage: 'No current community found',
						},
					};
				}

				const result = await context.applicationServices.Community.Member.createMember(command);

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

				const targetMember = await context.applicationServices.Community.Member.queryById({ id: args.input.memberId });
				if (targetMember?.communityId) {
					const actorMemberId = await getActorMemberIdForCommunity(context, String(targetMember.communityId));
					if (actorMemberId && actorMemberId === String(args.input.memberId)) {
						return {
							status: {
								success: false,
								errorMessage: 'You cannot deactivate your own membership.',
							},
						};
					}
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

				const targetMember = await context.applicationServices.Community.Member.queryById({ id: args.input.memberId });
				if (targetMember?.communityId) {
					const actorMemberId = await getActorMemberIdForCommunity(context, String(targetMember.communityId));
					if (actorMemberId && actorMemberId === String(args.input.memberId)) {
						return {
							status: {
								success: false,
								errorMessage: 'You cannot remove your own membership.',
							},
						};
					}
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

				const communityId = args.input.communityId ? String(args.input.communityId) : undefined;
				const actorMemberId = await getActorMemberIdForCommunity(context, communityId);
				const filteredMemberIds = actorMemberId
					? args.input.memberIds.filter((id) => String(id) !== actorMemberId)
					: [...args.input.memberIds];

				if (filteredMemberIds.length === 0) {
					return {
						status: {
							success: false,
							errorMessage: 'No eligible members to deactivate.',
						},
						members: [],
						successCount: 0,
						failedCount: args.input.memberIds.length,
					};
				}

				const command: BulkDeactivateMembersCommand = {
					memberIds: filteredMemberIds,
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

				const communityId = args.input.communityId ? String(args.input.communityId) : undefined;
				const actorMemberId = await getActorMemberIdForCommunity(context, communityId);
				const filteredMemberIds = actorMemberId
					? args.input.memberIds.filter((id) => String(id) !== actorMemberId)
					: [...args.input.memberIds];

				if (filteredMemberIds.length === 0) {
					return {
						status: {
							success: false,
							errorMessage: 'No eligible members to remove.',
						},
						members: [],
						successCount: 0,
						failedCount: args.input.memberIds.length,
					};
				}

				const command: BulkRemoveMembersCommand = {
					memberIds: filteredMemberIds,
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
					successCount: filteredMemberIds.length,
					failedCount: args.input.memberIds.length - filteredMemberIds.length,
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

		memberCreateAccount: async (_parent: unknown, args: MutationMemberCreateAccountArgs, context: GraphContext) => {
			try {
				if (!context.applicationServices.verifiedUser?.verifiedJwt) {
					return {
						status: {
							success: false,
							errorMessage: 'Unauthorized',
						},
					};
				}

				const command: MemberCreateAccountCommand = {
					memberId: args.input.memberId,
					endUserId: args.input.endUserId,
				};

				const result = await context.applicationServices.Community.Member.createMemberAccount(command);

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
						errorMessage: error instanceof Error ? error.message : 'Failed to create member account',
					},
					member: null,
				};
			}
		},

		memberUpdateAccount: async (_parent: unknown, args: MutationMemberUpdateAccountArgs, context: GraphContext) => {
			try {
				if (!context.applicationServices.verifiedUser?.verifiedJwt) {
					return {
						status: {
							success: false,
							errorMessage: 'Unauthorized',
						},
					};
				}

				const command: MemberUpdateAccountCommand = {
					memberId: args.input.memberId,
					accountId: args.input.accountId,
					endUserId: args.input.endUserId,
				};

				const result = await context.applicationServices.Community.Member.updateMemberAccount(command);

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
						errorMessage: error instanceof Error ? error.message : 'Failed to update member account',
					},
					member: null,
				};
			}
		},

		memberRemoveAccount: async (_parent: unknown, args: MutationMemberRemoveAccountArgs, context: GraphContext) => {
			try {
				if (!context.applicationServices.verifiedUser?.verifiedJwt) {
					return {
						status: {
							success: false,
							errorMessage: 'Unauthorized',
						},
					};
				}

				const command: MemberRemoveAccountCommand = {
					memberId: args.input.memberId,
					accountId: args.input.accountId,
				};

				const result = await context.applicationServices.Community.Member.removeMemberAccount(command);

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
						errorMessage: error instanceof Error ? error.message : 'Failed to remove member account',
					},
					member: null,
				};
			}
		},
		memberUpdateProfile: async (_parent: unknown, args: MutationMemberUpdateProfileArgs, context: GraphContext) => {
			try {
				if (!context.applicationServices.verifiedUser?.verifiedJwt) {
					return {
						status: {
							success: false,
							errorMessage: 'Unauthorized',
						},
						member: null,
					};
				}

				const command: MemberUpdateProfileCommand = {
					memberId: args.input.memberId,
					profile: {
						...(args.input.profile.name !== undefined ? { name: args.input.profile.name } : {}),
						...(args.input.profile.email !== undefined ? { email: args.input.profile.email } : {}),
						...(args.input.profile.bio !== undefined ? { bio: args.input.profile.bio } : {}),
						...(args.input.profile.avatarDocumentId !== undefined ? { avatarDocumentId: args.input.profile.avatarDocumentId } : {}),
						...(args.input.profile.interests != null ? { interests: [...args.input.profile.interests] } : {}),
						...(args.input.profile.showInterests !== undefined ? { showInterests: args.input.profile.showInterests } : {}),
						...(args.input.profile.showEmail !== undefined ? { showEmail: args.input.profile.showEmail } : {}),
						...(args.input.profile.showProfile !== undefined ? { showProfile: args.input.profile.showProfile } : {}),
						...(args.input.profile.showLocation !== undefined ? { showLocation: args.input.profile.showLocation } : {}),
						...(args.input.profile.showProperties !== undefined ? { showProperties: args.input.profile.showProperties } : {}),
					},
				};

				const result = await context.applicationServices.Community.Member.updateMemberProfile(command);
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
						errorMessage: error instanceof Error ? error.message : 'Failed to update member profile',
					},
					member: null,
				};
			}
		},
	},
};

export default member;
