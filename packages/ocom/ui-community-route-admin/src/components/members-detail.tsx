import { Descriptions } from 'antd';
import dayjs from 'dayjs';
import type React from 'react';
import type { AdminMembersDetailContainerMemberFieldsFragment } from '../generated.tsx';

interface MembersDetailProps {
	data: {
		member: AdminMembersDetailContainerMemberFieldsFragment;
	};
}

export const MembersDetail: React.FC<MembersDetailProps> = (props) => {
	return (
		<div>
			<Descriptions
				title="Member Info"
				size={'small'}
				layout={'vertical'}
			>
				<Descriptions.Item label="Id">{props.data.member.id}</Descriptions.Item>
				<Descriptions.Item label="Member Name">{props.data.member.memberName}</Descriptions.Item>
				<Descriptions.Item label="Role">{props.data.member.role?.roleName ?? 'No Role'}</Descriptions.Item>
				<Descriptions.Item label="Created At">{dayjs(props.data.member.createdAt).format('MM/DD/YYYY')}</Descriptions.Item>
				<Descriptions.Item label="Updated At">{dayjs(props.data.member.updatedAt).format('MM/DD/YYYY')}</Descriptions.Item>
			</Descriptions>
		</div>
	);
};
