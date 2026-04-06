import { App } from 'antd';
import { useMutation } from '@apollo/client';
import { AdminMemberAddContainerMemberAddDocument, AdminMemberListContainerMembersByCommunityIdDocument } from '../../../../generated.tsx';
import { MemberAddModal } from './member-add-modal.tsx';

export interface MemberAddModalContainerProps {
	communityId: string;
	open: boolean;
	onClose: () => void;
}

export const MemberAddModalContainer: React.FC<MemberAddModalContainerProps> = ({ communityId, open, onClose }) => {
	const { message } = App.useApp();

	const [addMember, { loading }] = useMutation(AdminMemberAddContainerMemberAddDocument, {
		refetchQueries: [{ query: AdminMemberListContainerMembersByCommunityIdDocument, variables: { communityId } }],
	});

	const handleAdd = async (values: { memberName: string; firstName: string; lastName?: string; userExternalId: string }) => {
		try {
			const result = await addMember({
				variables: {
					input: {
						communityId,
						memberName: values.memberName,
						firstName: values.firstName,
						lastName: values.lastName,
						userExternalId: values.userExternalId,
					},
				},
			});
			if (result.data?.memberAdd?.status?.success) {
				void message.success('Member added successfully');
				onClose();
			} else {
				void message.error(result.data?.memberAdd?.status?.errorMessage ?? 'Failed to add member');
			}
		} catch (error) {
			void message.error((error as Error).message ?? 'Failed to add member');
		}
	};

	return (
		<MemberAddModal
			communityId={communityId}
			open={open}
			loading={loading}
			onAdd={handleAdd}
			onCancel={onClose}
		/>
	);
};
