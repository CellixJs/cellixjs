import { Badge, Button, Popconfirm, Table } from 'antd';
import dayjs from 'dayjs';
import type React from 'react';
import type { AdminMembersAccountsListContainerMemberFieldsFragment } from '../../../../generated.tsx';

type AccountType = AdminMembersAccountsListContainerMemberFieldsFragment['accounts'][number];

const getStatusColor = (statusCode?: string | null): 'success' | 'warning' | 'error' | 'default' => {
	switch (statusCode) {
		case 'ACCEPTED':
			return 'success';
		case 'CREATED':
			return 'warning';
		case 'REJECTED':
			return 'error';
		default:
			return 'default';
	}
};

const getStatusLabel = (statusCode?: string | null): string => {
	switch (statusCode) {
		case 'ACCEPTED':
			return 'Active';
		case 'CREATED':
			return 'Pending';
		case 'REJECTED':
			return 'Rejected';
		default:
			return statusCode ?? 'Unknown';
	}
};

export interface MembersAccountsListProps {
	data: AdminMembersAccountsListContainerMemberFieldsFragment;
	onRemove: (accountId: string) => Promise<void>;
	removeLoading?: boolean;
}

export const MembersAccountsList: React.FC<MembersAccountsListProps> = (props) => {
	const columns = [
		{
			title: 'Name',
			key: 'name',
			render: (_: unknown, record: AccountType) => `${record.firstName} ${record.lastName ?? ''}`.trim(),
		},
		{
			title: 'Status',
			key: 'statusCode',
			render: (_: unknown, record: AccountType) => (
				<Badge
					status={getStatusColor(record.statusCode)}
					text={getStatusLabel(record.statusCode)}
				/>
			),
		},
		{
			title: 'Created',
			key: 'createdAt',
			render: (_: unknown, record: AccountType) => (record.createdAt ? dayjs(record.createdAt as string).format('MM/DD/YYYY') : '—'),
		},
		{
			title: 'Action',
			key: 'action',
			render: (_: unknown, record: AccountType) => (
				<Popconfirm
					title="Remove account"
					description="Are you sure you want to remove this account?"
					onConfirm={() => props.onRemove(record.id)}
					okText="Yes"
					cancelText="No"
				>
					<Button
						danger
						size="small"
						loading={props.removeLoading}
					>
						Remove
					</Button>
				</Popconfirm>
			),
		},
	];

	return (
		<Table
			dataSource={props.data.accounts.map((a) => ({ ...a, key: a.id }))}
			columns={columns}
			pagination={false}
			size="small"
		/>
	);
};
