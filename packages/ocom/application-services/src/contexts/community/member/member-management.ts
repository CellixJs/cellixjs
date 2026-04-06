import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

//#region Invite Member Operations (TODO: Implement when repository methods are available)

/*
export interface MemberInviteCommand {
	communityId: string;
	email: string;
	role?: string; // Default to 'member' if not specified
	message?: string;
	expiresInDays?: number; // Default to 7 days if not specified
}

export interface BulkMemberInviteCommand {
	communityId: string;
	invitations: Array<{
		email: string;
		role?: string;
		message?: string;
	}>;
	expiresInDays?: number; // Default to 7 days if not specified
}

export const inviteMember = (dataSources: DataSources) => {
	return async (command: MemberInviteCommand): Promise<Domain.Contexts.Community.Member.MemberInvitationEntityReference> => {
		// TODO: Implement when MemberInvitation repository methods are available
		throw new Error('Member invitation functionality not yet implemented');
	};
};

export const bulkInviteMembers = (dataSources: DataSources) => {
	return async (command: BulkMemberInviteCommand): Promise<Domain.Contexts.Community.Member.MemberInvitationEntityReference[]> => {
		// TODO: Implement when MemberInvitation repository methods are available
		throw new Error('Bulk member invitation functionality not yet implemented');
	};
};

export interface UpdateMemberRoleCommand {
	memberId: string;
	communityId: string;
	roleId: string;
}

export const updateMemberRole = (dataSources: DataSources) => {
	return async (command: UpdateMemberRoleCommand): Promise<Domain.Contexts.Community.Member.MemberEntityReference> => {
		// TODO: Implement when updateRole method is added to Member domain class
		throw new Error('Update member role functionality not yet implemented');
	};
};
*/

//#endregion

//#region Member Management Operations

export interface ActivateMemberCommand {
	memberId: string;
	communityId: string;
}

export interface DeactivateMemberCommand {
	memberId: string;
	communityId: string;
	reason?: string;
}

export interface RemoveMemberCommand {
	memberId: string;
	communityId: string;
	reason?: string;
}

export const activateMember = (dataSources: DataSources) => {
	return async (command: ActivateMemberCommand): Promise<Domain.Contexts.Community.Member.MemberEntityReference> => {
		let activatedMember: Domain.Contexts.Community.Member.MemberEntityReference | undefined;

		await dataSources.domainDataSource.Community.Member.MemberUnitOfWork.withScopedTransaction(async (repository) => {
			const member = await repository.getById(command.memberId);

			if (member.props.communityId !== command.communityId) {
				throw new Error('Member does not belong to the specified community');
			}

			// Activate member using the domain method we already implemented
			member.requestActivateMember();

			activatedMember = await repository.save(member);
		});

		if (!activatedMember) {
			throw new Error('Unable to activate member');
		}

		return activatedMember;
	};
};

export const deactivateMember = (dataSources: DataSources) => {
	return async (command: DeactivateMemberCommand): Promise<Domain.Contexts.Community.Member.MemberEntityReference> => {
		let deactivatedMember: Domain.Contexts.Community.Member.MemberEntityReference | undefined;

		await dataSources.domainDataSource.Community.Member.MemberUnitOfWork.withScopedTransaction(async (repository) => {
			const member = await repository.getById(command.memberId);

			if (member.props.communityId !== command.communityId) {
				throw new Error('Member does not belong to the specified community');
			}

			// Deactivate member using the domain method we already implemented
			member.requestDeactivateMember();

			deactivatedMember = await repository.save(member);
		});

		if (!deactivatedMember) {
			throw new Error('Unable to deactivate member');
		}

		return deactivatedMember;
	};
};

export const removeMember = (dataSources: DataSources) => {
	return async (command: RemoveMemberCommand): Promise<void> => {
		await dataSources.domainDataSource.Community.Member.MemberUnitOfWork.withScopedTransaction(async (repository) => {
			const member = await repository.getById(command.memberId);

			if (member.props.communityId !== command.communityId) {
				throw new Error('Member does not belong to the specified community');
			}

			// Remove member using the domain method we already implemented
			member.requestRemoveMember();

			await repository.save(member);
		});
	};
};

//#endregion

//#region Bulk Operations

export interface BulkActivateMembersCommand {
	memberIds: string[];
	communityId: string;
}

export interface BulkDeactivateMembersCommand {
	memberIds: string[];
	communityId: string;
	reason?: string;
}

export interface BulkRemoveMembersCommand {
	memberIds: string[];
	communityId: string;
	reason?: string;
}

export const bulkActivateMembers = (dataSources: DataSources) => {
	return async (command: BulkActivateMembersCommand): Promise<Domain.Contexts.Community.Member.MemberEntityReference[]> => {
		const results: Domain.Contexts.Community.Member.MemberEntityReference[] = [];

		await dataSources.domainDataSource.Community.Member.MemberUnitOfWork.withScopedTransaction(async (repository) => {
			for (const memberId of command.memberIds) {
				try {
					const member = await repository.getById(memberId);

					if (member.props.communityId !== command.communityId) {
						continue; // Skip members not in the specified community
					}

					member.requestActivateMember();
					const activatedMember = await repository.save(member);
					results.push(activatedMember);
				} catch (error) {
					// Log error and continue with other members
					console.error(`Failed to activate member ${memberId}:`, error);
				}
			}
		});

		return results;
	};
};

export const bulkDeactivateMembers = (dataSources: DataSources) => {
	return async (command: BulkDeactivateMembersCommand): Promise<Domain.Contexts.Community.Member.MemberEntityReference[]> => {
		const results: Domain.Contexts.Community.Member.MemberEntityReference[] = [];

		await dataSources.domainDataSource.Community.Member.MemberUnitOfWork.withScopedTransaction(async (repository) => {
			for (const memberId of command.memberIds) {
				try {
					const member = await repository.getById(memberId);

					if (member.props.communityId !== command.communityId) {
						continue; // Skip members not in the specified community
					}

					member.requestDeactivateMember();
					const deactivatedMember = await repository.save(member);
					results.push(deactivatedMember);
				} catch (error) {
					// Log error and continue with other members
					console.error(`Failed to deactivate member ${memberId}:`, error);
				}
			}
		});

		return results;
	};
};

export const bulkRemoveMembers = (dataSources: DataSources) => {
	return async (command: BulkRemoveMembersCommand): Promise<void> => {
		await dataSources.domainDataSource.Community.Member.MemberUnitOfWork.withScopedTransaction(async (repository) => {
			for (const memberId of command.memberIds) {
				try {
					const member = await repository.getById(memberId);

					if (member.props.communityId !== command.communityId) {
						continue; // Skip members not in the specified community
					}

					member.requestRemoveMember();
					await repository.save(member);
				} catch (error) {
					// Log error and continue with other members
					console.error(`Failed to remove member ${memberId}:`, error);
				}
			}
		});
	};
};

//#endregion
