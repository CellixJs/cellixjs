import type React from 'react';
import { useState } from 'react';
import { App } from 'antd';
import { useQuery, useMutation } from '@apollo/client';
import {
	AdminMemberDetailContainerMembersByCommunityDocument,
	AdminMemberDetailContainerUpdateMemberRoleDocument,
	type AdminMemberDetailContainerMemberFieldsFragment,
	type AdminMemberDetailContainerUpdateMemberRoleMutation,
	type AdminMemberDetailContainerUpdateMemberRoleMutationVariables,
} from '../../../../generated.tsx';
import { ComponentQueryLoader } from '@cellix/ui-core';
import { MemberDetail } from './member-detail.tsx';

export interface MemberDetailContainerProps {
	memberId: string;
	communityId: string;
	onClose?: () => void;
}

export const MemberDetailContainer: React.FC<MemberDetailContainerProps> = ({ memberId, communityId, onClose }) => {
	const { message } = App.useApp();
	const [isEditing, setIsEditing] = useState(false);

	// Query members by community and find the specific member
	const { data, loading, error, refetch } = useQuery(AdminMemberDetailContainerMembersByCommunityDocument, {
		variables: { communityId },
		errorPolicy: 'all',
	});

	// Find the specific member from the list
	const member = data?.membersByCommunityId?.find((memberItem: AdminMemberDetailContainerMemberFieldsFragment) => memberItem.id === memberId);

	// Update member role mutation
	const [updateMemberRole, { loading: updateRoleLoading }] = useMutation<AdminMemberDetailContainerUpdateMemberRoleMutation, AdminMemberDetailContainerUpdateMemberRoleMutationVariables>(
		AdminMemberDetailContainerUpdateMemberRoleDocument,
	);

	const handleUpdateRole = async (roleId: string, reason: string): Promise<void> => {
		try {
			const result = await updateMemberRole({
				variables: {
					input: {
						memberId,
						roleId,
						reason,
					},
				},
			});

			const status = result.data?.updateMemberRole?.status;
			if (status?.success) {
				message.success('Member role updated successfully');
				await refetch();
				setIsEditing(false);
			} else {
				message.error(status?.errorMessage || 'Failed to update member role');
			}
		} catch {
			message.error('Failed to update member role');
		}
	};

	const handleEdit = (): void => {
		setIsEditing(true);
	};

	const handleCancelEdit = (): void => {
		setIsEditing(false);
	};

	const handleRefresh = async (): Promise<void> => {
		try {
			await refetch();
			message.success('Member details refreshed');
		} catch {
			message.error('Failed to refresh member details');
		}
	};

	const memberDetailProps = {
		member: member as AdminMemberDetailContainerMemberFieldsFragment | null,
		loading: updateRoleLoading,
		isEditing,
		onEdit: handleEdit,
		onCancelEdit: handleCancelEdit,
		onUpdateRole: handleUpdateRole,
		onClose,
		onRefresh: handleRefresh,
	};

	return (
		<ComponentQueryLoader
			loading={loading}
			error={error}
			hasData={member}
			noDataComponent={<div>Member not found</div>}
			hasDataComponent={<MemberDetail {...memberDetailProps} />}
		/>
	);
};
