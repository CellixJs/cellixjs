import { useMutation } from '@apollo/client';
import { App } from 'antd';
import { useParams } from 'react-router-dom';
import { AdminMemberInviteModalContainerBulkInviteMembersDocument, AdminMemberInviteModalContainerInviteMemberDocument } from '../../../../generated.tsx';
import { MemberInviteModal, type MemberInviteModalProps } from './member-invite-modal.tsx';

interface MemberInviteModalContainerProps {
	open: boolean;
	onClose: () => void;
	onSuccess?: () => void;
}

export const MemberInviteModalContainer: React.FC<MemberInviteModalContainerProps> = (props) => {
	const { open, onClose, onSuccess } = props;
	const { communityId } = useParams<{ communityId: string }>();
	const { message } = App.useApp();

	const [inviteMemberMutation, { loading: inviteLoading }] = useMutation(AdminMemberInviteModalContainerInviteMemberDocument);
	const [bulkInviteMembersMutation, { loading: bulkInviteLoading }] = useMutation(AdminMemberInviteModalContainerBulkInviteMembersDocument);

	const handleSingleInvite = async (email: string, inviteMessage?: string, expiresInDays?: number) => {
		if (!communityId) return;

		try {
			const result = await inviteMemberMutation({
				variables: {
					input: {
						communityId,
						email,
						message: inviteMessage,
						expiresInDays,
					},
				},
			});

			if (result.data?.inviteMember?.status?.success) {
				message.success('Member invitation sent successfully');
				onSuccess?.();
				onClose();
			} else {
				message.error(result.data?.inviteMember?.status?.errorMessage || 'Failed to send invitation');
			}
		} catch (_error) {
			message.error('An error occurred while sending invitation');
		}
	};

	const handleBulkInvite = async (invitations: Array<{ email: string; message?: string }>, expiresInDays?: number) => {
		if (!communityId) return;

		try {
			const result = await bulkInviteMembersMutation({
				variables: {
					input: {
						communityId,
						invitations,
						expiresInDays,
					},
				},
			});

			if (result.data?.bulkInviteMembers?.status?.success) {
				const successCount = result.data.bulkInviteMembers.successCount || 0;
				const failedCount = result.data.bulkInviteMembers.failedCount || 0;

				if (failedCount > 0) {
					message.warning(`${successCount} invitation(s) sent successfully, ${failedCount} failed`);
				} else {
					message.success(`${successCount} invitation(s) sent successfully`);
				}
				onSuccess?.();
				onClose();
			} else {
				message.error(result.data?.bulkInviteMembers?.status?.errorMessage || 'Failed to send invitations');
			}
		} catch (_error) {
			message.error('An error occurred while sending invitations');
		}
	};

	const memberInviteModalProps: MemberInviteModalProps = {
		open,
		onClose,
		onSingleInvite: handleSingleInvite,
		onBulkInvite: handleBulkInvite,
		loading: inviteLoading || bulkInviteLoading,
	};

	return <MemberInviteModal {...memberInviteModalProps} />;
};
