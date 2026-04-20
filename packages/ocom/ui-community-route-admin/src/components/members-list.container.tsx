import { useApolloClient, useMutation, useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import { App } from 'antd';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
	AdminMemberListContainerActivateMemberDocument,
	AdminMemberListContainerBulkActivateMembersDocument,
	AdminMemberListContainerBulkDeactivateMembersDocument,
	AdminMemberListContainerBulkRemoveMembersDocument,
	AdminMemberListContainerDeactivateMemberDocument,
	type AdminMemberListContainerMemberFieldsFragment,
	AdminMemberListContainerMembersDocument,
	type AdminMemberListContainerMembersQuery,
	type AdminMemberListContainerMembersQueryVariables,
	AdminMemberListContainerRemoveMemberDocument,
} from '../generated.tsx';
import { MembersInviteModalContainer } from './members-invite-modal.container.tsx';
import { MemberList, type MemberListProps } from './members-list.tsx';

export const MemberListContainer: React.FC = () => {
	const { communityId } = useParams<{ communityId: string }>();
	const navigate = useNavigate();
	const apolloClient = useApolloClient();
	const { message } = App.useApp();
	const [inviteModalVisible, setInviteModalVisible] = useState(false);

	const {
		data: membersData,
		loading: membersLoading,
		error: membersError,
		refetch: refetchMembers,
	} = useQuery(AdminMemberListContainerMembersDocument, {
		variables: { communityId: communityId ?? '' },
		skip: !communityId,
	});

	const [activateMemberMutation, { loading: activateLoading }] = useMutation(AdminMemberListContainerActivateMemberDocument);
	const [deactivateMemberMutation, { loading: deactivateLoading }] = useMutation(AdminMemberListContainerDeactivateMemberDocument);
	const [removeMemberMutation, { loading: removeLoading }] = useMutation(AdminMemberListContainerRemoveMemberDocument);

	const [bulkActivateMembersMutation, { loading: bulkActivateLoading }] = useMutation(AdminMemberListContainerBulkActivateMembersDocument);
	const [bulkDeactivateMembersMutation, { loading: bulkDeactivateLoading }] = useMutation(AdminMemberListContainerBulkDeactivateMembersDocument);
	const [bulkRemoveMembersMutation, { loading: bulkRemoveLoading }] = useMutation(AdminMemberListContainerBulkRemoveMembersDocument);

	const removeMembersFromCache = (memberIds: string[]) => {
		if (!communityId || memberIds.length === 0) {
			return;
		}

		const variables: AdminMemberListContainerMembersQueryVariables = { communityId };
		const existing = membersData ?? null;
		const filteredMembers = existing?.membersByCommunityId.filter((member) => !memberIds.includes(String(member.id)));
		if (!filteredMembers) {
			return;
		}

		const next: AdminMemberListContainerMembersQuery = {
			...existing,
			membersByCommunityId: filteredMembers,
		};

		// Keep UI consistent with remove semantics by pruning removed members from the member list query cache.
		// Remove operations are soft-delete in domain and otherwise remain visible in list queries.
		apolloClient.writeQuery({
			query: AdminMemberListContainerMembersDocument,
			variables,
			data: next,
		});
	};

	const handleActivateMember = async (memberId: string) => {
		try {
			const result = await activateMemberMutation({
				variables: {
					input: {
						memberId,
						communityId: communityId ?? '',
					},
				},
			});

			if (result.data?.activateMember?.status?.success) {
				message.success('Member activated successfully');
				await refetchMembers();
			} else {
				message.error(result.data?.activateMember?.status?.errorMessage || 'Failed to activate member');
			}
		} catch (_error) {
			message.error('An error occurred while activating member');
		}
	};

	const handleDeactivateMember = async (memberId: string, reason?: string) => {
		try {
			const input = {
				memberId,
				communityId: communityId ?? '',
				...(reason !== undefined ? { reason } : {}),
			};
			const result = await deactivateMemberMutation({
				variables: {
					input,
				},
			});

			if (result.data?.deactivateMember?.status?.success) {
				message.success('Member deactivated successfully');
				await refetchMembers();
			} else {
				message.error(result.data?.deactivateMember?.status?.errorMessage || 'Failed to deactivate member');
			}
		} catch (_error) {
			message.error('An error occurred while deactivating member');
		}
	};

	const handleRemoveMember = async (memberId: string, reason?: string): Promise<boolean> => {
		try {
			const input = {
				memberId,
				communityId: communityId ?? '',
				...(reason !== undefined ? { reason } : {}),
			};
			const result = await removeMemberMutation({
				variables: {
					input,
				},
			});

			if (result.data?.removeMember?.status?.success) {
				message.success('Member removed successfully');
				removeMembersFromCache([memberId]);
				return true;
			} else {
				message.error(result.data?.removeMember?.status?.errorMessage || 'Failed to remove member');
			}
		} catch (_error) {
			message.error('An error occurred while removing member');
		}
		return false;
	};

	const handleBulkActivateMembers = async (memberIds: string[]): Promise<boolean> => {
		try {
			const result = await bulkActivateMembersMutation({
				variables: {
					input: {
						memberIds: [...memberIds],
						communityId: communityId ?? '',
					},
				},
			});

			const successCount = result.data?.bulkActivateMembers?.successCount ?? 0;
			const failedCount = result.data?.bulkActivateMembers?.failedCount ?? 0;
			if (result.data?.bulkActivateMembers?.status?.success && successCount > 0) {
				message.success(`${successCount} member(s) activated successfully`);
				await refetchMembers();
				if (failedCount > 0) {
					message.error(`${failedCount} member(s) could not be activated`);
				}
				return true;
			} else {
				message.error(result.data?.bulkActivateMembers?.status?.errorMessage || 'Failed to activate selected members');
			}
		} catch (_error) {
			message.error('An error occurred while activating members');
		}
		return false;
	};

	const handleBulkDeactivateMembers = async (memberIds: string[], reason: string): Promise<boolean> => {
		try {
			const result = await bulkDeactivateMembersMutation({
				variables: {
					input: {
						memberIds: [...memberIds],
						communityId: communityId ?? '',
						reason,
					},
				},
			});

			const successCount = result.data?.bulkDeactivateMembers?.successCount ?? 0;
			const failedCount = result.data?.bulkDeactivateMembers?.failedCount ?? 0;
			if (result.data?.bulkDeactivateMembers?.status?.success && successCount > 0) {
				message.success(`${successCount} member(s) deactivated successfully`);
				await refetchMembers();
				if (failedCount > 0) {
					message.error(`${failedCount} member(s) could not be deactivated`);
				}
				return true;
			} else {
				message.error(result.data?.bulkDeactivateMembers?.status?.errorMessage || 'Failed to deactivate selected members');
			}
		} catch (_error) {
			message.error('An error occurred while deactivating members');
		}
		return false;
	};

	const handleBulkRemoveMembers = async (memberIds: string[], reason: string): Promise<boolean> => {
		try {
			const result = await bulkRemoveMembersMutation({
				variables: {
					input: {
						memberIds: [...memberIds],
						communityId: communityId ?? '',
						reason,
					},
				},
			});

			const successCount = result.data?.bulkRemoveMembers?.successCount ?? 0;
			if (result.data?.bulkRemoveMembers?.status?.success && successCount > 0) {
				message.success(`${successCount} member(s) removed successfully`);
				removeMembersFromCache(memberIds);
				return true;
			} else {
				message.error(result.data?.bulkRemoveMembers?.status?.errorMessage || 'Failed to remove selected members');
			}
		} catch (_error) {
			message.error('An error occurred while removing members');
		}
		return false;
	};

	const handleMemberEdit = (memberId: string) => {
		navigate(memberId);
	};

	const handleOpenInviteModal = () => {
		setInviteModalVisible(true);
	};

	const handleCloseInviteModal = () => {
		setInviteModalVisible(false);
	};

	const handleInviteSuccess = async () => {
		await refetchMembers();
	};

	const memberListProps: MemberListProps = {
		data: (membersData?.membersByCommunityId ?? []) as AdminMemberListContainerMemberFieldsFragment[],
		...(communityId !== undefined ? { communityId } : {}),
		onActivateMember: handleActivateMember,
		onDeactivateMember: handleDeactivateMember,
		onRemoveMember: handleRemoveMember,
		onBulkActivateMembers: handleBulkActivateMembers,
		onBulkDeactivateMembers: handleBulkDeactivateMembers,
		onBulkRemoveMembers: handleBulkRemoveMembers,
		onInviteMember: handleOpenInviteModal,
		onMemberEdit: handleMemberEdit,
		loading: activateLoading || deactivateLoading || removeLoading || bulkActivateLoading || bulkDeactivateLoading || bulkRemoveLoading,
	};

	return (
		<>
			<ComponentQueryLoader
				loading={membersLoading}
				hasData={membersData?.membersByCommunityId}
				hasDataComponent={<MemberList {...memberListProps} />}
				error={membersError}
			/>
			<MembersInviteModalContainer
				open={inviteModalVisible}
				onClose={handleCloseInviteModal}
				onSuccess={handleInviteSuccess}
			/>
		</>
	);
};
