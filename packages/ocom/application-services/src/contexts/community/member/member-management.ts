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
		const errors: { email: string; error: unknown }[] = [];

		await dataSources.domainDataSource.Community.Member.MemberInvitationUnitOfWork.withScopedTransaction(async (repository) => {
			for (const inv of command.invitations) {
				try {
					const newInvitation = await repository.getNewInstance(command.communityId, inv.email, inv.message ?? '', expiresAt, invitedBy.id);
					const saved = await repository.save(newInvitation);
					invitations.push(saved);
				} catch (error) {
					errors.push({ email: inv.email, error });
				}
			}
		});

		if (errors.length > 0 && invitations.length === 0) {
			throw new Error(`Failed to create all invitations: ${errors.map((e) => e.email).join(', ')}`);
		}

		return invitations;
	};
};

//#endregion

export const updateMemberRole = (dataSources: DataSources) => {
	return async (command: UpdateMemberRoleCommand): Promise<Domain.Contexts.Community.Member.MemberEntityReference> => {
		// Fetch and validate the target role first (read-only, cheap check before opening the write transaction)
		let newRole: Domain.Contexts.Community.Role.EndUserRole.EndUserRoleEntityReference | undefined;

		await dataSources.domainDataSource.Community.Role.EndUserRole.EndUserRoleUnitOfWork.withScopedTransaction(async (roleRepo) => {
			newRole = await roleRepo.getById(command.roleId);
		});

		if (!newRole) {
			throw new Error('Role not found');
		}

		// Update the member and validate community ownership within a single transaction
		let updatedMember: Domain.Contexts.Community.Member.MemberEntityReference | undefined;

		await dataSources.domainDataSource.Community.Member.MemberUnitOfWork.withScopedTransaction(async (memberRepository) => {
			const member = await memberRepository.getById(command.memberId);

			if (String(newRole?.community.id) !== String(member.communityId)) {
				throw new Error('Role does not belong to the same community as the member');
			}

			if (!newRole) {
				throw new Error('Role validation failed');
			}

			member.role = newRole;
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
		const errors: { memberId: string; error: unknown }[] = [];

		await dataSources.domainDataSource.Community.Member.MemberUnitOfWork.withScopedTransaction(async (repository) => {
			for (const memberId of command.memberIds) {
				try {
					const member = await repository.getById(memberId);
					member.requestActivateMember();
					const activatedMember = await repository.save(member);
					results.push(activatedMember);
				} catch (error) {
					errors.push({ memberId, error });
				}
			}
		});

		if (errors.length > 0 && results.length === 0) {
			throw new Error(`Failed to activate all members: ${errors.map((e) => e.memberId).join(', ')}`);
		}

		return results;
	};
};

export const bulkDeactivateMembers = (dataSources: DataSources) => {
	return async (command: BulkDeactivateMembersCommand): Promise<Domain.Contexts.Community.Member.MemberEntityReference[]> => {
		const results: Domain.Contexts.Community.Member.MemberEntityReference[] = [];
		const errors: { memberId: string; error: unknown }[] = [];

		await dataSources.domainDataSource.Community.Member.MemberUnitOfWork.withScopedTransaction(async (repository) => {
			for (const memberId of command.memberIds) {
				try {
					const member = await repository.getById(memberId);
					member.requestDeactivateMember();
					const deactivatedMember = await repository.save(member);
					results.push(deactivatedMember);
				} catch (error) {
					errors.push({ memberId, error });
				}
			}
		});

		if (errors.length > 0 && results.length === 0) {
			throw new Error(`Failed to deactivate all members: ${errors.map((e) => e.memberId).join(', ')}`);
		}

		return results;
	};
};

export const bulkRemoveMembers = (dataSources: DataSources) => {
	return async (command: BulkRemoveMembersCommand): Promise<void> => {
		const errors: { memberId: string; error: unknown }[] = [];

		await dataSources.domainDataSource.Community.Member.MemberUnitOfWork.withScopedTransaction(async (repository) => {
			for (const memberId of command.memberIds) {
				try {
					const member = await repository.getById(memberId);
					member.requestRemoveMember();
					await repository.save(member);
				} catch (error) {
					errors.push({ memberId, error });
				}
			}
		});

		if (errors.length > 0) {
			throw new Error(`Failed to remove member(s): ${errors.map((e) => e.memberId).join(', ')}`);
		}
	};
};

//#endregion

//#region Member Account Management Operations

export interface MemberCreateAccountCommand {
	memberId: string;
	endUserId: string;
}

const getAccountNameFromEndUser = (endUser: Domain.Contexts.User.EndUser.EndUserEntityReference): { firstName: string; lastName?: string } => {
	const firstName = endUser.personalInformation.identityDetails.restOfName?.trim() || endUser.displayName?.trim();
	if (!firstName) {
		throw new Error(`Selected end user (${endUser.id}) does not have a usable display name`);
	}

	const lastName = endUser.personalInformation.identityDetails.lastName?.trim();
	return {
		firstName,
		...(lastName ? { lastName } : {}),
	};
};

const ensureEndUserIsAlreadyInCommunity = async (dataSources: DataSources, communityId: string, endUserId: string): Promise<void> => {
	const membersInCommunity = await dataSources.readonlyDataSource.Community.Member.MemberReadRepo.getByCommunityId(communityId);
	const isExistingCommunityEndUser = membersInCommunity.some((communityMember) => communityMember.accounts.some((account) => account.user.id === endUserId));
	if (!isExistingCommunityEndUser) {
		throw new Error('Selected user is not associated with this community. Invite the user first.');
	}
};

export const createMemberAccount = (dataSources: DataSources) => {
	return async (command: MemberCreateAccountCommand): Promise<Domain.Contexts.Community.Member.MemberEntityReference> => {
		let updatedMember: Domain.Contexts.Community.Member.MemberEntityReference | undefined;

		await dataSources.domainDataSource.Community.Member.MemberUnitOfWork.withScopedTransaction(async (repository) => {
			const member = await repository.getById(command.memberId);
			const endUser = await dataSources.readonlyDataSource.User.EndUser.EndUserReadRepo.getById(command.endUserId);
			if (!endUser) {
				throw new Error(`End user ${command.endUserId} not found`);
			}

			await ensureEndUserIsAlreadyInCommunity(dataSources, member.communityId, command.endUserId);

			if (member.accounts.some((account) => account.user.id === command.endUserId)) {
				throw new Error('Selected user is already associated with this member');
			}

			const accountName = getAccountNameFromEndUser(endUser);

			const newAccount = member.requestNewAccount();
			newAccount.user = endUser;
			newAccount.firstName = accountName.firstName;
			if (accountName.lastName) {
				newAccount.lastName = accountName.lastName;
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
	endUserId: string;
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

			const endUser = await dataSources.readonlyDataSource.User.EndUser.EndUserReadRepo.getById(command.endUserId);
			if (!endUser) {
				throw new Error(`End user ${command.endUserId} not found`);
			}

			await ensureEndUserIsAlreadyInCommunity(dataSources, member.communityId, command.endUserId);

			if (member.accounts.some((acc) => acc.id !== command.accountId && acc.user.id === command.endUserId)) {
				throw new Error('Selected user is already associated with this member');
			}

			const accountName = getAccountNameFromEndUser(endUser);

			// Update the account properties
			account.user = endUser;
			account.firstName = accountName.firstName;
			if (accountName.lastName !== undefined) {
				account.lastName = accountName.lastName;
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

export interface MemberUpdateProfileCommand {
	memberId: string;
	profile: {
		name?: string | null;
		email?: string | null;
		bio?: string | null;
		avatarDocumentId?: string | null;
		interests?: string[] | null;
		showInterests?: boolean | null;
		showEmail?: boolean | null;
		showProfile?: boolean | null;
		showLocation?: boolean | null;
		showProperties?: boolean | null;
	};
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

export const updateMemberProfile = (dataSources: DataSources) => {
	return async (command: MemberUpdateProfileCommand): Promise<Domain.Contexts.Community.Member.MemberEntityReference> => {
		let updatedMember: Domain.Contexts.Community.Member.MemberEntityReference | undefined;

		await dataSources.domainDataSource.Community.Member.MemberUnitOfWork.withScopedTransaction(async (repository) => {
			const member = await repository.getById(command.memberId);
			const profile = member.profile;

			if (command.profile.name !== undefined && command.profile.name !== null) {
				profile.name = command.profile.name;
				member.memberName = command.profile.name;
			}
			if (command.profile.email !== undefined && command.profile.email !== null) {
				profile.email = command.profile.email;
			}
			if (command.profile.bio !== undefined && command.profile.bio !== null) {
				profile.bio = command.profile.bio;
			}
			if (command.profile.avatarDocumentId !== undefined && command.profile.avatarDocumentId !== null) {
				profile.avatarDocumentId = command.profile.avatarDocumentId;
			}
			if (command.profile.interests !== undefined && command.profile.interests !== null) {
				profile.interests = command.profile.interests;
			}
			if (command.profile.showInterests !== undefined && command.profile.showInterests !== null) {
				profile.showInterests = command.profile.showInterests;
			}
			if (command.profile.showEmail !== undefined && command.profile.showEmail !== null) {
				profile.showEmail = command.profile.showEmail;
			}
			if (command.profile.showProfile !== undefined && command.profile.showProfile !== null) {
				profile.showProfile = command.profile.showProfile;
			}
			if (command.profile.showLocation !== undefined && command.profile.showLocation !== null) {
				profile.showLocation = command.profile.showLocation;
			}
			if (command.profile.showProperties !== undefined && command.profile.showProperties !== null) {
				profile.showProperties = command.profile.showProperties;
			}

			updatedMember = await repository.save(member);
		});

		if (!updatedMember) {
			throw new Error('Unable to update member profile');
		}

		return updatedMember;
	};
};

//#endregion
