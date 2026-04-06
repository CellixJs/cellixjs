import { App } from 'antd';
import { useMutation, useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import type { AdminMemberListContainerMemberFieldsFragment } from '../../../../generated.tsx';
import { AdminMemberListContainerMemberRemoveDocument, AdminMemberListContainerMembersByCommunityIdDocument } from '../../../../generated.tsx';
import { MemberList, type MemberListProps } from './member-list.tsx';
import { MemberAddModalContainer } from './member-add-modal.container.tsx';

export const MemberListContainer: React.FC = () => {
	const { message } = App.useApp();
	const params = useParams();
	// biome-ignore lint:useLiteralKeys
	const communityId = params['communityId'] ?? '';
	const [addModalOpen, setAddModalOpen] = useState(false);

	const {
		data: membersData,
		loading: membersLoading,
		error: membersError,
	} = useQuery(AdminMemberListContainerMembersByCommunityIdDocument, {
		variables: { communityId },
		skip: !communityId,
	});

	const [removeMember, { loading: removeLoading }] = useMutation(AdminMemberListContainerMemberRemoveDocument, {
		refetchQueries: [{ query: AdminMemberListContainerMembersByCommunityIdDocument, variables: { communityId } }],
	});

	const handleRemove = async (memberId: string) => {
		try {
			const result = await removeMember({ variables: { input: { memberId } } });
			if (result.data?.memberRemove?.status?.success) {
				void message.success('Member removed successfully');
			} else {
				void message.error(result.data?.memberRemove?.status?.errorMessage ?? 'Failed to remove member');
			}
		} catch (error) {
			void message.error((error as Error).message ?? 'Failed to remove member');
		}
	};

	const memberListProps: MemberListProps = {
		data: (membersData?.membersByCommunityId ?? []) as AdminMemberListContainerMemberFieldsFragment[],
		onAdd: () => setAddModalOpen(true),
		onRemove: handleRemove,
		removeLoading,
	};

	return (
		<>
			<ComponentQueryLoader
				loading={membersLoading}
				hasData={membersData}
				hasDataComponent={<MemberList {...memberListProps} />}
				error={membersError}
				noDataComponent={
					<MemberList
						data={[]}
						onAdd={() => setAddModalOpen(true)}
					/>
				}
			/>
			<MemberAddModalContainer
				communityId={communityId}
				open={addModalOpen}
				onClose={() => setAddModalOpen(false)}
			/>
		</>
	);
};
