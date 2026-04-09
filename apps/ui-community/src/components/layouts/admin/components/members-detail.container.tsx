import { useMutation, useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import { App, Divider, Typography } from 'antd';
import { useParams } from 'react-router-dom';
import { AdminMembersDetailContainerMemberDocument, AdminMembersDetailContainerMemberUpdateDocument, type AdminMembersDetailContainerMemberFieldsFragment, type MemberUpdateInput } from '../../../../generated.tsx';
import { MembersAccountsListContainer } from './members-accounts-list.container.tsx';
import { MembersDetail, type MembersDetailProps } from './members-detail.tsx';

const { Title } = Typography;

export const MembersDetailContainer: React.FC = () => {
	const { message } = App.useApp();
	const params = useParams();
	// biome-ignore lint:useLiteralKeys
	const memberId = params['memberId'] ?? '';

	const { data, loading, error } = useQuery(AdminMembersDetailContainerMemberDocument, {
		variables: { id: memberId },
		skip: !memberId,
	});

	const [memberUpdate, { loading: mutationLoading, error: mutationError }] = useMutation(AdminMembersDetailContainerMemberUpdateDocument);

	const handleSave = async (values: MemberUpdateInput) => {
		if (!data?.member?.id) {
			message.error('Member not found');
			return;
		}
		try {
			const result = await memberUpdate({
				variables: {
					input: {
						id: data.member.id,
						memberName: values.memberName,
					},
				},
			});
			if (result.data?.memberUpdate?.status?.success) {
				message.success('Saved');
			} else {
				message.error(result.data?.memberUpdate?.status?.errorMessage ?? 'Unknown error');
			}
		} catch (saveError) {
			message.error(`Error updating member: ${saveError instanceof Error ? saveError.message : JSON.stringify(saveError)}`);
		}
	};

	const detailProps: MembersDetailProps = {
		onSave: handleSave,
		data: data?.member as AdminMembersDetailContainerMemberFieldsFragment,
		loading: mutationLoading,
	};

	return (
		<>
			<ComponentQueryLoader
				loading={loading}
				hasData={data?.member}
				hasDataComponent={<MembersDetail {...detailProps} />}
				error={error ?? mutationError}
			/>
			{data?.member && (
				<>
					<Divider />
					<Title level={5}>Accounts</Title>
					<MembersAccountsListContainer />
				</>
			)}
		</>
	);
};
