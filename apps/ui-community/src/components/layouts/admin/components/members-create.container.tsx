import { App } from 'antd';
import { useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import {
	AdminMembersCreateContainerMemberCreateDocument,
	AdminMembersListContainerMembersByCommunityIdDocument,
	type MemberCreateInput,
} from '../../../../generated.tsx';
import type { MembersCreateProps } from './members-create.tsx';
import { MembersCreate } from './members-create.tsx';

interface MembersCreateContainerProps {
	data: {
		communityId: string;
	};
}

export const MembersCreateContainer: React.FC<MembersCreateContainerProps> = (
	props,
) => {
	const navigate = useNavigate();
	const { message } = App.useApp();
	const [memberCreate, { loading }] = useMutation(
		AdminMembersCreateContainerMemberCreateDocument,
		{
			update(cache, { data }) {
				// update the list with the new item
				const newMember = data?.memberCreate.member;
				const members = cache.readQuery({
					query: AdminMembersListContainerMembersByCommunityIdDocument,
					variables: { communityId: props.data.communityId ?? '' },
				})?.membersByCommunityId;
				if (newMember && members) {
					cache.writeQuery({
						query: AdminMembersListContainerMembersByCommunityIdDocument,
						variables: { communityId: props.data.communityId ?? '' },
						data: {
							membersByCommunityId: [...members, newMember],
						},
					});
				}
			},
		},
	);

	const defaultValues: MemberCreateInput = {
		memberName: '',
	};

	const handleSave = async (values: MemberCreateInput) => {
		try {
			const result = await memberCreate({
				variables: {
					input: values,
				},
			});

			if (result.data?.memberCreate.status.success) {
				message.success('Member Created');
				navigate(`../${result.data?.memberCreate.member?.id}`, {
					replace: true,
				});
			} else {
				message.error(
					`Error creating Member: ${result.data?.memberCreate.status.errorMessage}`,
				);
			}
		} catch (error) {
			message.error(`Error creating Member: ${JSON.stringify(error)}`);
		}
	};

	const membersCreateProps: MembersCreateProps = {
		data: defaultValues,
		onSave: handleSave,
		loading,
	};

	return <MembersCreate {...membersCreateProps} />;
};
