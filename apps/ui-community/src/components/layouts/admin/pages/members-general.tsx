import { useParams } from 'react-router-dom';
import { MembersDetailContainer } from '../components/members-detail.container.tsx';

export const MembersGeneral: React.FC = () => {
	const params = useParams();

	return (
		<MembersDetailContainer
			data={{
				id: params.id ?? '',
				communityId: params.communityId ?? '',
			}}
		/>
	);
};
