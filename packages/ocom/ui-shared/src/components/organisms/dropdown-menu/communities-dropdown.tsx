import { Dropdown, type MenuProps } from 'antd';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface MemberSummary {
	id: string;
	memberName?: string | null;
	isAdmin?: boolean | null;
	community?: {
		id?: string | null;
		name?: string | null;
	} | null;
}

export interface CommunitiesDropdownProps {
	data: {
		members: MemberSummary[];
	};
}

export const CommunitiesDropdown: React.FC<CommunitiesDropdownProps> = (props) => {
	const [dropdownVisible, setDropdownVisible] = useState(false);
	const params = useParams();
	const navigate = useNavigate();

	const currentMember = props.data.members?.find(
		// biome-ignore lint:useLiteralKeys
		(member) => member.id === params['memberId'],
	);

	const itemsMap: Record<string, { key: string; label: string; children: { key: string; label: string; onClick: () => void }[] }> = {};

	for (const member of props.data.members ?? []) {
		const communityId = member.community?.id;
		if (!communityId) {
			continue;
		}

		itemsMap[communityId] ??= {
			key: communityId,
			label: member.community?.name ?? '',
			children: [],
		};

		const memberPath = `/community/${communityId}/member/${member.id}`;
		itemsMap[communityId].children.push({
			key: member.id,
			label: member.memberName ?? '',
			onClick: () => {
				setDropdownVisible(false);
				navigate(memberPath);
			},
		});

		if (member.isAdmin) {
			const adminPath = `/community/${communityId}/admin/${member.id}`;
			itemsMap[communityId].children.push({
				key: `${member.id}-admin`,
				label: `${member.memberName ?? ''} (Admin)`,
				onClick: () => {
					setDropdownVisible(false);
					navigate(adminPath);
				},
			});
		}
	}

	const items: MenuProps['items'] = Object.values(itemsMap);

	return (
		<Dropdown
			menu={{
				items,
				selectable: true,
				// biome-ignore lint:useLiteralKeys
				defaultSelectedKeys: [params['memberId'] ?? ''],
			}}
			open={dropdownVisible}
			onOpenChange={(visible) => setDropdownVisible(visible)}
		>
			<button
				type="button"
				onClick={(e) => e.preventDefault()}
				className="ant-dropdown-link"
				style={{ minHeight: '50px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
			>
				{currentMember?.community?.name} | {currentMember?.memberName}
			</button>
		</Dropdown>
	);
};
