import { Badge, Input, Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import type React from 'react';
import type { AdminMemberListContainerMemberFieldsFragment } from '../../../../generated.tsx';

const { Title } = Typography;
const { Search } = Input;

export interface MemberListProps {
	data: AdminMemberListContainerMemberFieldsFragment[];
	searchValue: string;
	onSearchChange: (value: string) => void;
}

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

export const MemberList: React.FC<MemberListProps> = (props) => {
	const filteredMembers = props.data.filter((member) => {
		const search = props.searchValue.toLocaleLowerCase();
		if (!search) return true;
		const nameMatch = member.memberName?.toLocaleLowerCase().includes(search);
		const emailMatch = member.profile?.email?.toLocaleLowerCase().includes(search);
		const accountNameMatch = member.accounts.some(
			(account) =>
				account.firstName.toLocaleLowerCase().includes(search) || account.lastName?.toLocaleLowerCase().includes(search),
		);
		return nameMatch || emailMatch || accountNameMatch;
	});

	const columns = [
		{
			title: 'Member Name',
			key: 'memberName',
			render: (_: unknown, record: AdminMemberListContainerMemberFieldsFragment) => (
				<span>
					{record.memberName ?? '—'}
					{record.isAdmin && (
						<Tag
							color="blue"
							className="ml-2"
						>
							Admin
						</Tag>
					)}
				</span>
			),
		},
		{
			title: 'Email',
			key: 'email',
			render: (_: unknown, record: AdminMemberListContainerMemberFieldsFragment) => record.profile?.email ?? '—',
		},
		{
			title: 'Accounts',
			key: 'accounts',
			render: (_: unknown, record: AdminMemberListContainerMemberFieldsFragment) => (
				<div>
					{record.accounts.map((account) => (
						<div
							key={account.id}
							className="flex items-center gap-2 mb-1"
						>
							<span>
								{account.firstName} {account.lastName ?? ''}
							</span>
							<Badge
								status={getStatusColor(account.statusCode)}
								text={getStatusLabel(account.statusCode)}
							/>
						</div>
					))}
				</div>
			),
		},
		{
			title: 'Member Since',
			key: 'createdAt',
			render: (_: unknown, record: AdminMemberListContainerMemberFieldsFragment) => {
				const earliest = record.accounts
					.filter((a) => a.createdAt)
					.map((a) => new Date(a.createdAt as string).getTime())
					.sort((a, b) => a - b)[0];
				return earliest ? dayjs(earliest).format('MM/DD/YYYY') : '—';
			},
		},
	];

	const tableData = filteredMembers.map((member) => ({
		...member,
		key: member.id,
	}));

	return (
		<div>
			<div className="flex justify-between items-center mb-4">
				<Title level={4}>Community Members</Title>
				<Search
					placeholder="Search by name or email"
					value={props.searchValue}
					onChange={(e) => props.onSearchChange(e.target.value)}
					style={{ width: 280 }}
					allowClear
				/>
			</div>
			{filteredMembers.length > 0 ? (
				<Table
					dataSource={tableData}
					columns={columns}
					pagination={{ position: ['bottomRight'] }}
					size="middle"
				/>
			) : (
				<Title
					level={5}
					style={{ display: 'flex', justifyContent: 'center' }}
				>
					No members found.
				</Title>
			)}
		</div>
	);
};
