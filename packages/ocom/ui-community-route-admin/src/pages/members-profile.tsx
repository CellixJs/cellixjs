import { useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import { Button, Descriptions } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminMembersProfileMemberDocument } from '../generated.tsx';

interface MembersProfileParams {
	id?: string;
	communityId?: string;
	memberId?: string;
	[key: string]: string | undefined;
}

export const MembersProfile: React.FC = () => {
	const navigate = useNavigate();
	const params = useParams<MembersProfileParams>();
	const communityId = params.communityId ?? '';
	const adminMemberId = params.memberId ?? '';
	const memberId = params.id ?? '';
	const {
		data: memberData,
		loading: memberLoading,
		error: memberError,
	} = useQuery(AdminMembersProfileMemberDocument, {
		variables: { id: memberId },
		skip: !memberId,
	});
	const member = memberData?.member ?? null;

	return (
		<ComponentQueryLoader
			loading={memberLoading}
			hasData={member}
			error={memberError}
			noDataComponent={<div>No member profile found</div>}
			hasDataComponent={
				<div>
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
					<Button
						type="primary"
						onClick={() => navigate(`/community/${communityId}/admin/${adminMemberId}/members/${memberId}/profile/edit`)}
					>
						Edit Profile
					</Button>
				</div>
			}
		/>
	);
};
