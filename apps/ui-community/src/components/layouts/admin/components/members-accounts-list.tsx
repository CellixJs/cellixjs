import { UsergroupAddOutlined } from '@ant-design/icons';
import { Button, Table, type TableColumnsType } from 'antd';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import type { AdminMembersAccountsListContainerMemberAccountFieldsFragment } from '../../../../generated.tsx';

export interface MembersAccountsListProps {
	data: AdminMembersAccountsListContainerMemberAccountFieldsFragment[];
}

export const MembersAccountsList: React.FC<MembersAccountsListProps> = (
	props,
) => {
	const navigate = useNavigate();
	const columns: TableColumnsType<AdminMembersAccountsListContainerMemberAccountFieldsFragment> =
		[
			{
				title: 'Action',
				dataIndex: 'id',
				render: (
					text: AdminMembersAccountsListContainerMemberAccountFieldsFragment['id'],
				) => (
					<Button type="primary" size="small" onClick={() => navigate(text)}>
						Edit
					</Button>
				),
			},
			{
				title: 'First Name',
				dataIndex: 'firstName',
				key: 'firstName',
			},
			{
				title: 'Last Name',
				dataIndex: 'lastName',
				key: 'lastName',
			},
			{
				title: 'Status',
				dataIndex: 'statusCode',
				key: 'statusCode',
			},
			{
				title: 'Updated',
				dataIndex: 'updatedAt',
				key: 'updatedAt',
				render: (
					text: AdminMembersAccountsListContainerMemberAccountFieldsFragment['updatedAt'],
				) => <span>{dayjs(text).format('MM/DD/YYYY')}</span>,
			},
			{
				title: 'Created',
				dataIndex: 'createdAt',
				key: 'createdAt',
				render: (
					text: AdminMembersAccountsListContainerMemberAccountFieldsFragment['createdAt'],
				) => <span>{dayjs(text).format('MM/DD/YYYY')}</span>,
			},
		];

	return (
		<>
			<Button
				onClick={() => navigate('./add')}
				icon={<UsergroupAddOutlined />}
			>
				Add Account
			</Button>
			<div>
				<Table
					columns={columns}
					dataSource={props.data}
					rowKey={(record) => record.id}
				/>
			</div>
		</>
	);
};
