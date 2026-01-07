import { Descriptions } from 'antd';
import type { AdminMembersProfileContainerMemberFieldsFragment } from '../../../../generated.tsx';

export interface MembersProfileProps {
	data: {
		member: AdminMembersProfileContainerMemberFieldsFragment;
	};
}

export const MembersProfile: React.FC<MembersProfileProps> = (props) => {
	return (
		<div>
			<Descriptions bordered column={1}>
				<Descriptions.Item label="Name">
					{props.data.member.profile?.name || 'N/A'}
				</Descriptions.Item>
				<Descriptions.Item label="Email">
					{props.data.member.profile?.email || 'N/A'}
				</Descriptions.Item>
				<Descriptions.Item label="Bio">
					{props.data.member.profile?.bio || 'N/A'}
				</Descriptions.Item>
				<Descriptions.Item label="Show Email">
					{props.data.member.profile?.showEmail ? 'Yes' : 'No'}
				</Descriptions.Item>
				<Descriptions.Item label="Show Profile">
					{props.data.member.profile?.showProfile ? 'Yes' : 'No'}
				</Descriptions.Item>
			</Descriptions>
		</div>
	);
};
