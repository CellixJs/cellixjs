import { useParams } from 'react-router-dom';
import { MemberProfile } from './member-profile.tsx';

interface MemberProfileContainerProps {
	data: {
		communityId: string;
	};
	isAdmin?: boolean;
}

export const MemberProfileContainer: React.FC<
	MemberProfileContainerProps
> = (props) => {
	const { id: memberId } = useParams();

	return (
		<MemberProfile
			data={{ id: memberId ?? '', communityId: props.data.communityId }}
		/>
	);
};
