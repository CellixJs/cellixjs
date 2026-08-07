import { DownOutlined } from '@ant-design/icons';
import { Button, Dropdown, Input, Space, Table, Typography } from 'antd';
import { useMemo, useState } from 'react';

const { Title } = Typography;

export interface CommunityTableMember {
	id: string;
	memberName?: string | null | undefined;
	isAdmin?: boolean | null | undefined;
}

export interface CommunityTableCommunity {
	id: string;
	name?: string | null;
}

export interface CommunityTableProps {
	communities: CommunityTableCommunity[];
	members: CommunityTableMember[][];
	onMemberPortalClick?: ((communityId: string, memberId: string) => void) | undefined;
	onAdminPortalClick?: ((communityId: string, memberId: string) => void) | undefined;
	onCreateCommunity?: (() => void) | undefined;
	className?: string | undefined;
}

export const CommunityTable: React.FC<CommunityTableProps> = ({ communities, members, onMemberPortalClick, onAdminPortalClick, onCreateCommunity, className }) => {
	const [searchValue, setSearchValue] = useState('');

	const filteredCommunities = useMemo(() => {
		if (!searchValue) {
			return communities;
		}
		const lowerSearch = searchValue.toLowerCase();
		return communities.filter((community) => community.name?.toLowerCase().includes(lowerSearch));
	}, [communities, searchValue]);

	const getCommunityMembers = (communityId: string): CommunityTableMember[] => {
		const communityIndex = communities.findIndex((community) => community.id === communityId);
		return members[communityIndex] ?? [];
	};

	const getAdminMembers = (communityMembers: CommunityTableMember[]) => communityMembers.filter((member) => member.isAdmin === true);

	const columns = [
		{
			title: 'Community Name',
			dataIndex: 'name',
			key: 'name',
		},
		{
			title: 'Member Portal',
			dataIndex: 'memberPortal',
			key: 'memberPortal',
		},
		{
			title: 'Admin Portal',
			dataIndex: 'adminPortal',
			key: 'adminPortal',
		},
	];

	const dataSource = filteredCommunities.map((community) => {
		const communityMembers = getCommunityMembers(community.id);
		const adminMembers = getAdminMembers(communityMembers);

		return {
			key: community.id,
			name: community.name,
			memberPortal: (
				<Dropdown
					menu={{
						items: communityMembers.map((member) => ({
							key: member.id,
							label: (
								<Button
									type="link"
									onClick={() => onMemberPortalClick?.(community.id, member.id)}
								>
									{member.memberName}
								</Button>
							),
						})),
					}}
				>
					<Button
						type="link"
						onClick={(event) => event.preventDefault()}
					>
						<Space>
							Member Portals
							<DownOutlined />
						</Space>
					</Button>
				</Dropdown>
			),
			adminPortal: (
				<Dropdown
					menu={{
						items: adminMembers.map((member) => ({
							key: member.id,
							label: (
								<Button
									type="link"
									onClick={() => onAdminPortalClick?.(community.id, member.id)}
								>
									{member.memberName}
								</Button>
							),
						})),
					}}
				>
					<Button
						type="link"
						onClick={(event) => event.preventDefault()}
					>
						<Space>
							Admin Portals
							<DownOutlined />
						</Space>
					</Button>
				</Dropdown>
			),
		};
	});

	return (
		<div className={className}>
			<Title level={3} className="uppercase">
				Navigate to a Community
			</Title>
			<div className="flex items-center gap-oc-md mb-oc-lg">
				<Input.Search
					className="w-1/2"
					placeholder="Search for a community"
					enterKeyHint="search"
					onChange={(event) => setSearchValue(event.target.value)}
					allowClear
				/>
				<div className="flex flex-1 justify-end">
					<Button type="primary" onClick={onCreateCommunity}>
						Create a Community
					</Button>
				</div>
			</div>

			{dataSource.length > 0 ? (
				<Table
					classNames={{ root: 'oc-community-table' }}
					dataSource={dataSource}
					columns={columns}
					pagination={{ position: ['bottomRight'] }}
				/>
			) : (
				<Title level={5} className="text-center">
					No communities found.
				</Title>
			)}
		</div>
	);
};
