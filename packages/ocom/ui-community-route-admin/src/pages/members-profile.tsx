import { MemberProfileContainer } from '@ocom/ui-community-route-shared';
import { useParams } from 'react-router-dom';

interface MembersProfileParams {
	id?: string;
	communityId?: string;
	memberId?: string;
	[key: string]: string | undefined;
}

export const MembersProfile: React.FC = () => {
	const params = useParams<MembersProfileParams>();

	return <MemberProfileContainer communityId={params.communityId ?? ''} isAdmin />;
};
