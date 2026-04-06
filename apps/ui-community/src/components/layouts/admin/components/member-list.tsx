import { CheckCircleOutlined, CloseCircleOutlined, DeleteOutlined, PlusOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Input, Popconfirm, Table, type TableProps, Tag, Typography, theme } from 'antd';
import { useMemo, useState } from 'react';
import type { AdminMemberListContainerMemberFieldsFragment } from '../../../../generated.tsx';

const { Text } = Typography;

export interface MemberListProps {
	data: AdminMemberListContainerMemberFieldsFragment[];
	onAdd?: () => void;
	onRemove?: (memberId: string) => void;
	removeLoading?: boolean;
}

type MemberRow = AdminMemberListContainerMemberFieldsFragment & { key: string };

export const MemberList: React.FC<MemberListProps> = (props) => {
	const [searchText, setSearchText] = useState('');
	const {
		token: { colorTextSecondary },
	} = theme.useToken();

	const filteredData = useMemo((): MemberRow[] => {
		const lower = searchText.toLowerCase();
		return props.data
			.filter((m) => {
				const name = (m.memberName ?? '').toLowerCase();
				const email = (m.profile?.email ?? '').toLowerCase();
				return name.includes(lower) || email.includes(lower);
			})
			.map((m) => ({ ...m, key: m.id }));
	}, [props.data, searchText]);

	const primaryAccount = (member: AdminMemberListContainerMemberFieldsFragment) => member.accounts[0];

	const columns: TableProps<MemberRow>['columns'] = [
		{
			title: 'Member',
			key: 'member',
			render: (_: unknown, record: MemberRow) => {
				const account = primaryAccount(record);
				const displayName = record.memberName ?? (account ? `${account.firstName} ${account.lastName ?? ''}`.trim() : '—');
				return (
					<div
						className="flex items-center gap-2"
						data-testid="member-row"
					>
						<Avatar
							icon={<UserOutlined />}
							size="small"
						/>
						<Text strong>{displayName}</Text>
					</div>
				);
			},
		},
		{
			title: 'Email',
			key: 'email',
			render: (_: unknown, record: MemberRow) => (
				<Text
					style={{ color: colorTextSecondary }}
					data-testid="member-email"
				>
					{record.profile?.email ?? '—'}
				</Text>
			),
		},
		{
			title: 'Status',
			key: 'status',
			render: (_: unknown, record: MemberRow) => {
				const statusCode = primaryAccount(record)?.statusCode;
				if (!statusCode) return <Text style={{ color: colorTextSecondary }}>—</Text>;
				const isActive = statusCode.toLowerCase() === 'active';
				return (
					<Tag
						icon={isActive ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
						color={isActive ? 'success' : 'default'}
						data-testid="member-status"
					>
						{statusCode}
					</Tag>
				);
			},
		},
		{
			title: 'Role',
			key: 'isAdmin',
			render: (_: unknown, record: MemberRow) =>
				record.isAdmin ? (
					<Tag
						color="blue"
						data-testid="member-role"
					>
						Admin
					</Tag>
				) : (
					<Tag
						color="default"
						data-testid="member-role"
					>
						Member
					</Tag>
				),
		},
		{
			title: 'Joined',
			key: 'createdAt',
			render: (_: unknown, record: MemberRow) => (
				<Text
					style={{ color: colorTextSecondary }}
					data-testid="member-joined"
				>
					{record.createdAt ? new Date(record.createdAt as string).toLocaleDateString() : '—'}
				</Text>
			),
		},
		...(props.onRemove
			? [
					{
						title: 'Actions',
						key: 'actions',
						render: (_: unknown, record: MemberRow) => (
							<Popconfirm
								title="Remove member"
								description="Are you sure you want to remove this member?"
								onConfirm={() => props.onRemove?.(record.id)}
								okText="Remove"
								cancelText="Cancel"
								okButtonProps={{ danger: true, loading: props.removeLoading }}
							>
								<Button
									type="text"
									danger
									icon={<DeleteOutlined />}
									data-testid="member-remove-btn"
								>
									Remove
								</Button>
							</Popconfirm>
						),
					},
				]
			: []),
	];

	return (
		<div>
			<div className="mb-4 flex items-center justify-between gap-2">
				<Input
					placeholder="Search by name or email"
					prefix={<SearchOutlined />}
					value={searchText}
					onChange={(e) => setSearchText(e.target.value)}
					allowClear
					data-testid="member-search"
					className="max-w-xs"
				/>
				{props.onAdd && (
					<Button
						type="primary"
						icon={<PlusOutlined />}
						onClick={props.onAdd}
						data-testid="member-add-btn"
					>
						Add Member
					</Button>
				)}
			</div>
			<Table
				columns={columns}
				dataSource={filteredData}
				pagination={{ pageSize: 20, showSizeChanger: false }}
				locale={{ emptyText: 'No members found' }}
				data-testid="member-table"
			/>
		</div>
	);
};
