import { useParams } from 'react-router-dom';
import { MemberProfileContainer } from '../../shared/components/member-profile.container.tsx';

export const MembersProfile: React.FC = () => {
	const params = useParams();

	return (
		<div>
			<h1>Members Profile</h1>
			<MemberProfileContainer
				data={{
					communityId: params.communityId ?? '',
				}}
				isAdmin
			/>
		</div>
	);
};
