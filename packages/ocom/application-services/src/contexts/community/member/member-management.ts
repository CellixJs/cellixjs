import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

export interface MemberCreateCommand {
	memberName: string;
	communityId: string;
}

export const createMember = (dataSources: DataSources) => {
	return async (command: MemberCreateCommand): Promise<Domain.Contexts.Community.Member.MemberEntityReference> => {
		// Validate: check for duplicate member name in the same community
		const nameExists = await dataSources.readonlyDataSource.Community.Member.MemberReadRepo.memberNameExistsInCommunity(command.memberName, command.communityId);
		if (nameExists) {
			throw new Error(`A member with the name "${command.memberName}" already exists in this community`);
		}

		let createdMember: Domain.Contexts.Community.Member.MemberEntityReference | undefined;

		// First, get the default role for the community
		let defaultRole: Domain.Contexts.Community.Role.EndUserRole.EndUserRoleEntityReference | undefined;

		await dataSources.domainDataSource.Community.Role.EndUserRole.EndUserRoleUnitOfWork.withScopedTransaction(async (roleRepository) => {
			const roles = await roleRepository.getByCommunityId(command.communityId);
			defaultRole = roles.find((role) => role.isDefault);
		});

		if (!defaultRole) {
			throw new Error('No default role found for this community');
		}

		// Create the new member
		await dataSources.domainDataSource.Community.Member.MemberUnitOfWork.withScopedTransaction(async (memberRepository) => {
			// Get community reference - we'll use a minimal community object
			const communityRef = { id: command.communityId } as Domain.Contexts.Community.Community.CommunityEntityReference;

			const newMember = await memberRepository.getNewInstance(command.memberName, communityRef);

			// Assign the default role to the member
			newMember.role = defaultRole as Domain.Contexts.Community.Role.EndUserRole.EndUserRoleEntityReference;

			createdMember = await memberRepository.save(newMember);
		});

		if (!createdMember) {
			throw new Error('Unable to create member');
		}

		return createdMember;
	};
};

//#region Role Management Operations

export interface UpdateMemberRoleCommand {
	memberId: string;
	roleId: string;
	reason?: string;
}

//#region Invitation Operations

export interface MemberInviteCommand {
	communityId: string;
	email: string;
	message?: string;
	expiresInDays?: number;
	invitedByExternalId: string;
}

export interface BulkMemberInviteCommand {
	communityId: string;
	invitations: Array<{ email: string; message?: string }>;
	expiresInDays?: number;
	invitedByExternalId: string;
}

export const inviteMember = (dataSources: DataSources) => {
	return async (command: MemberInviteCommand): Promise<Domain.Contexts.Community.Member.MemberInvitationEntityReference> => {
		const invitedBy = await dataSources.readonlyDataSource.User.EndUser.EndUserReadRepo.getByExternalId(command.invitedByExternalId);
		if (!invitedBy) {
			throw new Error('Inviting user not found');
		}

		const expiresInDays = command.expiresInDays ?? 7;
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + expiresInDays);

		let invitation: Domain.Contexts.Community.Member.MemberInvitationEntityReference | undefined;

		await dataSources.domainDataSource.Community.Member.MemberInvitationUnitOfWork.withScopedTransaction(async (repository) => {
			const newInvitation = await repository.getNewInstance(command.communityId, command.email, command.message ?? '', expiresAt, invitedBy.id);
			invitation = await repository.save(newInvitation);
		});

		if (!invitation) {
			throw new Error('Unable to create member invitation');
		}

		return invitation;
	};
};

export const bulkInviteMembers = (dataSources: DataSources) => {
	return async (command: BulkMemberInviteCommand): Promise<Domain.Contexts.Community.Member.MemberInvitationEntityReference[]> => {
		const invitedBy = await dataSources.readonlyDataSource.User.EndUser.EndUserReadRepo.getByExternalId(command.invitedByExternalId);
		if (!invitedBy) {
			throw new Error('Inviting user not found');
		}

		const expiresInDays = command.expiresInDays ?? 7;
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + expiresInDays);

		const invitations: Domain.Contexts.Community.Member.MemberInvitationEntityReference[] = [];

		await dataSources.domainDataSource.Community.Member.MemberInvitationUnitOfWork.withScopedTransaction(async (repository) => {
			for (const inv of command.invitations) {
				try {
					const newInvitation = await repository.getNewInstance(command.communityId, inv.email, inv.message ?? '', expiresAt, invitedBy.id);
					const saved = await repository.save(newInvitation);
					invitations.push(saved);
				} catch (error) {
					console.error(`Failed to create invitation for ${inv.email}:`, error);
				}
			}
		});

		return invitations;
	};
};

//#endregion

export const updateMemberRole = (dataSources: DataSources) => {
	return async (command: UpdateMemberRoleCommand): Promise<Domain.Contexts.Community.Member.MemberEntityReference> => {
		let updatedMember: Domain.Contexts.Community.Member.MemberEntityReference | undefined;
		let communityId: string | undefined;

		// First, get the member to derive the communityId
		await dataSources.domainDataSource.Community.Member.MemberUnitOfWork.withScopedTransaction(async (memberRepository) => {
			const member = await memberRepository.getById(command.memberId);
			communityId = member.props.communityId;
		});

		if (!communityId) {
			throw new Error('Unable to determine community from member');
		}

		// Then, get and validate the role using the derived communityId
		let newRole: Domain.Contexts.Community.Role.EndUserRole.EndUserRoleEntityReference | undefined;

		await dataSources.domainDataSource.Community.Role.EndUserRole.EndUserRoleUnitOfWork.withScopedTransaction(async (roleRepo) => {
			newRole = await roleRepo.getById(command.roleId);
		});

		if (!newRole) {
			throw new Error('Role not found');
		}

		// Verify role belongs to the same community as the member
		if (newRole.community.id !== communityId) {
			throw new Error('Role does not belong to the same community as the member');
		}

		// Now update the member with the validated role
		await dataSources.domainDataSource.Community.Member.MemberUnitOfWork.withScopedTransaction(async (memberRepository) => {
			// Get the member again
			const member = await memberRepository.getById(command.memberId);

			// Update the member's role
			if (!newRole) {
				throw new Error('Role validation failed');
			}
			member.role = newRole;

			// Save the updated member
			updatedMember = await memberRepository.save(member);
		});

		if (!updatedMember) {
			throw new Error('Unable to update member role');
		}

		return updatedMember;
	};
};

export interface ActivateMemberCommand {
	memberId: string;
}

export interface DeactivateMemberCommand {
	memberId: string;
	reason?: string;
}

export interface RemoveMemberCommand {
	memberId: string;
	reason?: string;
}

export const activateMember = (dataSources: DataSources) => {
	return async (command: ActivateMemberCommand): Promise<Domain.Contexts.Community.Member.MemberEntityReference> => {
		let activatedMember: Domain.Contexts.Community.Member.MemberEntityReference | undefined;

		await dataSources.domainDataSource.Community.Member.MemberUnitOfWork.withScopedTransaction(async (repository) => {
			const member = await repository.getById(command.memberId);

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
}

export interface BulkDeactivateMembersCommand {
	memberIds: string[];
	reason?: string;
}

export interface BulkRemoveMembersCommand {
	memberIds: string[];
	reason?: string;
}

export const bulkActivateMembers = (dataSources: DataSources) => {
	return async (command: BulkActivateMembersCommand): Promise<Domain.Contexts.Community.Member.MemberEntityReference[]> => {
		const results: Domain.Contexts.Community.Member.MemberEntityReference[] = [];

		await dataSources.domainDataSource.Community.Member.MemberUnitOfWork.withScopedTransaction(async (repository) => {
			for (const memberId of command.memberIds) {
				try {
					const member = await repository.getById(memberId);

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

//#region Member Account Management Operations

export interface MemberCreateAccountCommand {
	memberId: string;
	firstName: string;
	lastName?: string;
}

export const createMemberAccount = (dataSources: DataSources) => {
	return async (command: MemberCreateAccountCommand): Promise<Domain.Contexts.Community.Member.MemberEntityReference> => {
		let updatedMember: Domain.Contexts.Community.Member.MemberEntityReference | undefined;

		await dataSources.domainDataSource.Community.Member.MemberUnitOfWork.withScopedTransaction(async (repository) => {
			const member = await repository.getById(command.memberId);

			const newAccount = member.requestNewAccount();
			newAccount.firstName = command.firstName;
			if (command.lastName) {
				newAccount.lastName = command.lastName;
			}

			updatedMember = await repository.save(member);
		});

		if (!updatedMember) {
			throw new Error('Unable to create member account');
		}

		return updatedMember;
	};
};

export interface MemberUpdateAccountCommand {
	memberId: string;
	accountId: string;
	firstName: string;
	lastName?: string;
}

export const updateMemberAccount = (dataSources: DataSources) => {
	return async (command: MemberUpdateAccountCommand): Promise<Domain.Contexts.Community.Member.MemberEntityReference> => {
		let updatedMember: Domain.Contexts.Community.Member.MemberEntityReference | undefined;

		await dataSources.domainDataSource.Community.Member.MemberUnitOfWork.withScopedTransaction(async (repository) => {
			const member = await repository.getById(command.memberId);

			// Find the account to update
			const account = member.accounts.find((acc) => acc.id === command.accountId);
			if (!account) {
				throw new Error(`Account ${command.accountId} not found for member ${command.memberId}`);
			}

			// Update the account properties
			account.firstName = command.firstName;
			if (command.lastName !== undefined) {
				account.lastName = command.lastName;
			}

			updatedMember = await repository.save(member);
		});

		if (!updatedMember) {
			throw new Error('Unable to update member account');
		}

		return updatedMember;
	};
};

export interface MemberRemoveAccountCommand {
	memberId: string;
	accountId: string;
}

export const removeMemberAccount = (dataSources: DataSources) => {
	return async (command: MemberRemoveAccountCommand): Promise<Domain.Contexts.Community.Member.MemberEntityReference> => {
		let updatedMember: Domain.Contexts.Community.Member.MemberEntityReference | undefined;

		await dataSources.domainDataSource.Community.Member.MemberUnitOfWork.withScopedTransaction(async (repository) => {
			const member = await repository.getById(command.memberId);

			// Find the account to remove
			const accountToRemove = member.accounts.find((acc) => acc.id === command.accountId);
			if (!accountToRemove) {
				throw new Error(`Account ${command.accountId} not found for member ${command.memberId}`);
			}

			// Remove the account from the member using the domain method
			member.requestRemoveAccount(accountToRemove.props);

			updatedMember = await repository.save(member);
		});

		if (!updatedMember) {
			throw new Error('Unable to remove member account');
		}

		return updatedMember;
	};
};

//#endregion
