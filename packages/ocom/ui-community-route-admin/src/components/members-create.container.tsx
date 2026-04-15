import { useMutation } from '@apollo/client';
import { App } from 'antd';
import { useNavigate } from 'react-router-dom';
import type { MemberCreateInput } from '../../../../generated.tsx';
import { AdminMemberListContainerMembersDocument, AdminMembersCreateContainerMemberCreateDocument } from '../../../../generated.tsx';
import { MembersCreate } from './members-create.tsx';

interface MembersCreateContainerProps {
	data: {
		communityId: string;
	};
}

export const MembersCreateContainer: React.FC<MembersCreateContainerProps> = (props) => {
	const navigate = useNavigate();
	const { message } = App.useApp();

	const [memberCreate] = useMutation(AdminMembersCreateContainerMemberCreateDocument, {
		refetchQueries: [
			{
				query: AdminMemberListContainerMembersDocument,
				variables: { communityId: props.data.communityId ?? '' },
			},
		],
	});

	const defaultValues: MemberCreateInput = {
		memberName: '',
	};

	const handleSave = async (values: MemberCreateInput) => {
		try {
			const newMember = await memberCreate({
				variables: {
					input: values,
				},
			});

			if (newMember.data?.memberCreate.status?.success) {
				message.success('Member Created');
				navigate(`../${newMember.data?.memberCreate.member?.id}`, { replace: true });
			} else {
				message.error(newMember.data?.memberCreate.status?.errorMessage || 'Failed to create member');
			}
		} catch (_error) {
			message.error('An error occurred while creating member');
		}
	};

	return (
		<MembersCreate
			data={defaultValues}
			onSave={handleSave}
		/>
	);
};
