import { useParams } from 'react-router-dom';
import { Helmet } from '@dr.pogodin/react-helmet';
import { MemberProfileContainer } from '../../../shared/components/member-profile.container.tsx';

interface MembersProfileParams {
	communityId?: string;
	[key: string]: string | undefined;
}

export const MembersProfile: React.FC = () => {
	const params = useParams<MembersProfileParams>();

	return (
		<div>
			<Helmet>
				<title>Members Profile</title>
			</Helmet>
			<h1>Members Profile</h1>
			<MemberProfileContainer
				data={{ communityId: params.communityId ?? '' }}
				isAdmin
			/>
		</div>
	);
};
