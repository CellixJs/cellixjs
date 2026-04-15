import { useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import { Descriptions } from 'antd';
import { useParams } from 'react-router-dom';
import { AdminMemberListContainerMembersDocument } from '../generated.tsx';

interface MembersProfileParams {
	id?: string;
	communityId?: string;
	[key: string]: string | undefined;
}

export const MembersProfile: React.FC = () => {
	const params = useParams<MembersProfileParams>();
	const communityId = params.communityId ?? '';
	const memberId = params.id ?? '';
	const {
		data: memberData,
		loading: memberLoading,
		error: memberError,
	} = useQuery(AdminMemberListContainerMembersDocument, {
		variables: { communityId },
		skip: !communityId,
	});
	const member = memberData?.membersByCommunityId?.find((m) => m.id === memberId) ?? null;

	return (
		<ComponentQueryLoader
			loading={memberLoading}
			hasData={member}
			error={memberError}
			noDataComponent={<div>No member profile found</div>}
			hasDataComponent={
				<Descriptions
					column={1}
					title="Member Profile"
				>
					<Descriptions.Item label="Name">{member?.profile?.name || member?.memberName || 'N/A'}</Descriptions.Item>
					<Descriptions.Item label="Email">{member?.profile?.email || 'N/A'}</Descriptions.Item>
					<Descriptions.Item label="Bio">{member?.profile?.bio || 'N/A'}</Descriptions.Item>
					<Descriptions.Item label="Profile Visibility">{member?.profile?.showProfile ? 'Visible' : 'Hidden'}</Descriptions.Item>
					<Descriptions.Item label="Email Visibility">{member?.profile?.showEmail ? 'Visible' : 'Hidden'}</Descriptions.Item>
				</Descriptions>
			}
		/>
	);
};
