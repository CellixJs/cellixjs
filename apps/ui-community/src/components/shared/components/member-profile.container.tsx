import { useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import { MemberProfileContainerMemberProfileDocument } from '../../../generated.tsx';
import { MemberProfile } from './member-profile.tsx';

export interface MemberProfileContainerProps {
	data: {
		communityId: string;
	};
	isAdmin?: boolean;
}

export const MemberProfileContainer: React.FC<MemberProfileContainerProps> = (props) => {
	const { data: memberData, loading: memberLoading, error: memberError } = useQuery(MemberProfileContainerMemberProfileDocument);

	const memberProfileProps = {
		data: memberData?.memberForCurrentCommunity?.[0] || null,
		isAdmin: props.isAdmin || false,
	};

	return (
		<ComponentQueryLoader
			loading={memberLoading}
			hasData={memberData?.memberForCurrentCommunity?.[0]}
			hasDataComponent={<MemberProfile {...memberProfileProps} />}
			error={memberError}
			noDataComponent={<div>No member profile found</div>}
		/>
	);
};
