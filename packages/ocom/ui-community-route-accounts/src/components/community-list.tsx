import { CommunityTable } from '@ocom/ui-community-shared';
import { useNavigate } from 'react-router-dom';
import type { AccountsCommunityListContainerCommunityFieldsFragment, AccountsCommunityListContainerMemberFieldsFragment } from '../generated.tsx';

export interface CommunityListProps {
	data: {
		communities: AccountsCommunityListContainerCommunityFieldsFragment[];
		members: AccountsCommunityListContainerMemberFieldsFragment[][];
	};
}

export const CommunityList: React.FC<CommunityListProps> = (props) => {
	const navigate = useNavigate();

	const communities = props.data.communities.map((community) => ({
		id: community.id,
		name: community.name,
	}));

	const members = props.data.members.map((communityMembers) =>
		communityMembers.map((member) => ({
			id: member.id,
			memberName: member.memberName,
			isAdmin: member.isAdmin,
		})),
	);

	const handleMemberPortalClick = (communityId: string, memberId: string) => {
		navigate(`/community/${communityId}/member/${memberId}`);
	};

	const handleAdminPortalClick = (communityId: string, memberId: string) => {
		navigate(`/community/${communityId}/admin/${memberId}`);
	};

	const handleCreateCommunity = () => {
		navigate('create-community');
	};

	return (
		<CommunityTable
			communities={communities}
			members={members}
			onMemberPortalClick={handleMemberPortalClick}
			onAdminPortalClick={handleAdminPortalClick}
			onCreateCommunity={handleCreateCommunity}
		/>
	);
};
