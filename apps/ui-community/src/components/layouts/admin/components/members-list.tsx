import { Button, Table, type TableColumnsType } from 'antd';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import type { AdminMembersListContainerMemberFieldsFragment } from '../../../../generated.tsx';

export interface MembersListProps {
	data: AdminMembersListContainerMemberFieldsFragment[];
}

export const MembersList: React.FC<MembersListProps> = (props) => {
	const navigate = useNavigate();
	const columns: TableColumnsType<AdminMembersListContainerMemberFieldsFragment> =
		[
			{
				title: 'Action',
				dataIndex: 'id',
				render: (text: string) => (
					<Button
						type="primary"
						size="small"
						onClick={() => navigate(text)}
					>
						Edit
					</Button>
				),
			},
			{
				title: 'Member',
				dataIndex: 'memberName',
				key: 'memberName',
			},
			{
				title: 'Is Admin',
				dataIndex: 'isAdmin',
				key: 'isAdmin',
				render: (text: boolean) => <span>{text ? 'Yes' : 'No'}</span>,
			},
			{
				title: 'Updated',
				dataIndex: 'updatedAt',
				key: 'updatedAt',
				render: (text: string) => (
					<span>{dayjs(text).format('MM/DD/YYYY')}</span>
				),
			},
			{
				title: 'Created',
				dataIndex: 'createdAt',
				key: 'createdAt',
				render: (text: string) => (
					<span>{dayjs(text).format('MM/DD/YYYY')}</span>
				),
			},
		];

	return (
		<div>
			<Table
				columns={columns}
				dataSource={props.data}
				rowKey={(
					record: AdminMembersListContainerMemberFieldsFragment,
				) => record.id}
			/>
		</div>
	);
};
