import { useMutation } from '@apollo/client';
import { App } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminMembersCreateContainerMemberCreateDocument, type MemberCreateInput } from '../../../../generated.tsx';
import { MembersCreate, type MembersCreateProps } from './members-create.tsx';

export const MembersCreateContainer: React.FC = () => {
	const { message } = App.useApp();
	const navigate = useNavigate();
	const params = useParams();
	// biome-ignore lint:useLiteralKeys
	const communityId = params['communityId'] ?? '';

	const [memberCreate, { loading }] = useMutation(AdminMembersCreateContainerMemberCreateDocument);

	const handleSave = async (values: MemberCreateInput) => {
		try {
			const result = await memberCreate({
				variables: {
					input: {
						memberName: values.memberName,
						communityId,
					},
				},
			});
			if (result.data?.memberCreate?.status?.success && result.data.memberCreate.member) {
				message.success('Member created');
				navigate(`../${result.data.memberCreate.member.id}`);
			} else {
				message.error(result.data?.memberCreate?.status?.errorMessage ?? 'Unknown error');
			}
		} catch (createError) {
			message.error(`Error creating member: ${createError instanceof Error ? createError.message : JSON.stringify(createError)}`);
		}
	};

	const createProps: MembersCreateProps = {
		communityId,
		onSave: handleSave,
		loading,
	};

	return <MembersCreate {...createProps} />;
};
