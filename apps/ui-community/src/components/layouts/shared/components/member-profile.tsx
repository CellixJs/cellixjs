import { MemberProfileDetailsContainer } from './member-profile-details.container.tsx';
import { ProfilePhotoUploadContainer } from './profile-photo-upload.container.tsx';

interface MemberProfileProps {
	data: {
		id: string;
		communityId: string;
	};
}

export const MemberProfile: React.FC<MemberProfileProps> = (props) => {
	return (
		<>
			<ProfilePhotoUploadContainer
				data={{ id: props.data.id, communityId: props.data.communityId }}
			/>
			<MemberProfileDetailsContainer data={{ id: props.data.id }} />
		</>
	);
};
