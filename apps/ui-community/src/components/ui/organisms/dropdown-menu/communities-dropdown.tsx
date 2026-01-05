import { DownOutlined } from '@ant-design/icons';
import { Dropdown, type MenuProps } from 'antd';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Member } from '../../../../generated.tsx';

export interface CommunitiesDropdownProps {
	data: {
		members: Member[];
	};
}

export const CommunitiesDropdown: React.FC<CommunitiesDropdownProps> = (
	props,
) => {
	const [dropdownVisible, setDropdownVisible] = useState(false);
	const params = useParams();
	const navigate = useNavigate();

	const currentMember = props.data.members?.find(
        // biome-ignore lint:useLiteralKeys
		(member) => member.id === params['memberId'],
	);

	const populateItems = (
		member: Member,
		itemsMap: {
			[key: string]: {
				key: string;
				label: string | undefined;
				children: { key: string; label: string; onClick: () => void }[];
			};
		},
	) => {
		const communityId = member?.community?.id;
		if (!communityId) return;

		// Initialize community in itemsMap if it doesn't exist
		if (!itemsMap[communityId]) {
			itemsMap[communityId] = {
				key: communityId,
				label: member?.community?.name,
				children: [],
			};
		}

		// Add member to the community's children
		const memberPath = `/community/${communityId}/member/${member?.id}`;
		const memberItem = {
			key: member?.id ?? '',
			label: member?.memberName ?? '',
			onClick: () => {
				setDropdownVisible(false);
				navigate(memberPath);
			},
		};
		itemsMap[communityId].children.push(memberItem);

		// Add admin variant if applicable
		if (member?.isAdmin) {
			const adminPath = `/community/${communityId}/admin/${member?.id}`;
			itemsMap[communityId].children.push({
				key: `${member?.id}-admin`,
				label: `${member?.memberName} (Admin)`,
				onClick: () => {
					setDropdownVisible(false);
					navigate(adminPath);
				},
			});
		}
	};

	const itemsMap: {
		[key: string]: {
			key: string;
			label: string | undefined;
			children: { key: string; label: string; onClick: () => void }[];
		};
	} = {};
	props.data.members?.forEach((member: Member) =>
		populateItems(member, itemsMap),
	);

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
				{currentMember?.community?.name} | {currentMember?.memberName}{' '}
				<DownOutlined />
			</button>
		</Dropdown>
	);
};
