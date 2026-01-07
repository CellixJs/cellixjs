import { useParams } from 'react-router-dom';
import { MembersProfileContainer } from '../components/members-profile.container.tsx';

export const MembersProfile: React.FC = () => {
	const params = useParams();

	return (
		<MembersProfileContainer
			data={{
				id: params['id'] ?? '',
			}}
		/>
	);
};
