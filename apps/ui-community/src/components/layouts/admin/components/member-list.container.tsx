import { useQuery, useMutation } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import { useParams } from 'react-router-dom';
import { App } from 'antd';
import { useState } from 'react';
import type { AdminMemberListContainerMemberFieldsFragment } from '../../../../generated.tsx';
import {
	AdminMemberListContainerMembersDocument,
	AdminMemberListContainerActivateMemberDocument,
	AdminMemberListContainerDeactivateMemberDocument,
	AdminMemberListContainerRemoveMemberDocument,
	AdminMemberListContainerBulkActivateMembersDocument,
	AdminMemberListContainerBulkDeactivateMembersDocument,
	AdminMemberListContainerBulkRemoveMembersDocument,
} from '../../../../generated.tsx';
import { MemberList, type MemberListProps } from './member-list.tsx';
import { MemberInviteModalContainer } from './member-invite-modal.container.tsx';

export const MemberListContainer: React.FC = () => {
	const { communityId } = useParams<{ communityId: string }>();
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
			const result = await deactivateMemberMutation({
				variables: {
					input: {
						memberId,
						communityId: communityId ?? '',
						reason,
					},
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

	const handleRemoveMember = async (memberId: string, reason?: string) => {
		try {
			const result = await removeMemberMutation({
				variables: {
					input: {
						memberId,
						communityId: communityId ?? '',
						reason,
					},
				},
			});

			if (result.data?.removeMember?.status?.success) {
				message.success('Member removed successfully');
				await refetchMembers();
			} else {
				message.error(result.data?.removeMember?.status?.errorMessage || 'Failed to remove member');
			}
		} catch (_error) {
			message.error('An error occurred while removing member');
		}
	};

	const handleBulkActivateMembers = async (memberIds: string[]) => {
		try {
			const result = await bulkActivateMembersMutation({
				variables: {
					input: {
						memberIds: [...memberIds],
						communityId: communityId ?? '',
					},
				},
			});

			if (result.data?.bulkActivateMembers?.status?.success) {
				message.success(`${memberIds.length} member(s) activated successfully`);
				await refetchMembers();
			} else {
				message.error(result.data?.bulkActivateMembers?.status?.errorMessage || 'Failed to activate members');
			}
		} catch (_error) {
			message.error('An error occurred while activating members');
		}
	};

	const handleBulkDeactivateMembers = async (memberIds: string[], reason: string) => {
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

			if (result.data?.bulkDeactivateMembers?.status?.success) {
				message.success(`${memberIds.length} member(s) deactivated successfully`);
				await refetchMembers();
			} else {
				message.error(result.data?.bulkDeactivateMembers?.status?.errorMessage || 'Failed to deactivate members');
			}
		} catch (_error) {
			message.error('An error occurred while deactivating members');
		}
	};

	const handleBulkRemoveMembers = async (memberIds: string[], reason: string) => {
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

			if (result.data?.bulkRemoveMembers?.status?.success) {
				message.success(`${memberIds.length} member(s) removed successfully`);
				await refetchMembers();
			} else {
				message.error(result.data?.bulkRemoveMembers?.status?.errorMessage || 'Failed to remove members');
			}
		} catch (_error) {
			message.error('An error occurred while removing members');
		}
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
		data: membersData?.membersByCommunityId as AdminMemberListContainerMemberFieldsFragment[],
		communityId,
		onActivateMember: handleActivateMember,
		onDeactivateMember: handleDeactivateMember,
		onRemoveMember: handleRemoveMember,
		onBulkActivateMembers: handleBulkActivateMembers,
		onBulkDeactivateMembers: handleBulkDeactivateMembers,
		onBulkRemoveMembers: handleBulkRemoveMembers,
		onInviteMember: handleOpenInviteModal,
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
			<MemberInviteModalContainer
				open={inviteModalVisible}
				onClose={handleCloseInviteModal}
				onSuccess={handleInviteSuccess}
			/>
		</>
	);
};
