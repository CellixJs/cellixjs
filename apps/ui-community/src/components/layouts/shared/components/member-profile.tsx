import { MemberProfileDetailsContainer } from './member-profile-details.container.tsx';

interface MemberProfileProps {
	data: {
		id: string;
		communityId: string;
	};
}

export const MemberProfile: React.FC<MemberProfileProps> = (props) => {
	return (
		<>
			<MemberProfileDetailsContainer data={{ id: props.data.id }} />
		</>
	);
};
