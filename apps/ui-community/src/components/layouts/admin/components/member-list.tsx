import { Badge, Input, Table, type TableColumnsType, Tag, Typography } from 'antd';
import { useMemo, useState } from 'react';
import type { AdminMemberListContainerMemberFieldsFragment } from '../../../../generated.tsx';

const { Search } = Input;
const { Text } = Typography;

export interface MemberListProps {
	data: AdminMemberListContainerMemberFieldsFragment[];
}

interface MemberRow {
	key: string;
	id: string;
	memberName: string;
	firstName: string;
	lastName: string;
	statusCode: string;
	isAdmin: boolean;
}

const statusBadgeMap: Record<string, 'success' | 'processing' | 'error' | 'default'> = {
	ACCEPTED: 'success',
	CREATED: 'processing',
	REJECTED: 'error',
};

const columns: TableColumnsType<MemberRow> = [
	{
		title: 'Name',
		key: 'name',
		render: (_value: unknown, record: MemberRow) => (
			<span data-testid={`member-name-${record.id}`}>
				<Text strong>
					{record.firstName} {record.lastName}
				</Text>
				{record.memberName && (
					<Text
						type="secondary"
						className="ml-2"
					>
						({record.memberName})
					</Text>
				)}
			</span>
		),
	},
	{
		title: 'Status',
		dataIndex: 'statusCode',
		key: 'statusCode',
		render: (statusCode: string) => (
			<Badge
				status={statusBadgeMap[statusCode] ?? 'default'}
				text={statusCode}
			/>
		),
		filters: [
			{ text: 'Accepted', value: 'ACCEPTED' },
			{ text: 'Created', value: 'CREATED' },
			{ text: 'Rejected', value: 'REJECTED' },
		],
		onFilter: (value: React.Key | boolean, record: MemberRow) => record.statusCode === value,
	},
	{
		title: 'Role',
		dataIndex: 'isAdmin',
		key: 'isAdmin',
		render: (isAdmin: boolean) =>
			isAdmin ? (
				<Tag
					color="blue"
					data-testid="admin-tag"
				>
					Admin
				</Tag>
			) : (
				<Tag data-testid="member-tag">Member</Tag>
			),
		filters: [
			{ text: 'Admin', value: true },
			{ text: 'Member', value: false },
		],
		onFilter: (value: React.Key | boolean, record: MemberRow) => record.isAdmin === value,
	},
];

export const MemberList: React.FC<MemberListProps> = (props) => {
	const [searchText, setSearchText] = useState('');

	const rows: MemberRow[] = useMemo(() => {
		return props.data.flatMap((member) => {
			if (member.accounts.length === 0) {
				return [
					{
						key: member.id,
						id: member.id,
						memberName: member.memberName ?? '',
						firstName: '',
						lastName: '',
						statusCode: '',
						isAdmin: member.isAdmin ?? false,
					},
				];
			}
			return member.accounts.map((account) => ({
				key: `${member.id}-${account.id}`,
				id: member.id,
				memberName: member.memberName ?? '',
				firstName: account.firstName,
				lastName: account.lastName ?? '',
				statusCode: account.statusCode ?? '',
				isAdmin: member.isAdmin ?? false,
			}));
		});
	}, [props.data]);

	const filteredRows = useMemo(() => {
		if (!searchText) return rows;
		const lower = searchText.toLowerCase();
		return rows.filter((row) => row.firstName.toLowerCase().includes(lower) || row.lastName.toLowerCase().includes(lower) || row.memberName.toLowerCase().includes(lower));
	}, [rows, searchText]);

	return (
		<div>
			<Search
				placeholder="Search members by name"
				allowClear
				onChange={(e) => setSearchText(e.target.value)}
				className="mb-4"
				data-testid="member-search"
			/>
			<Table
				columns={columns}
				dataSource={filteredRows}
				rowKey="key"
				pagination={{ pageSize: 20 }}
				data-testid="member-table"
			/>
		</div>
	);
};
