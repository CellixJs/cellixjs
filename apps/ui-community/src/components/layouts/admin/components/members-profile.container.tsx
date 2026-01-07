import { useQuery } from '@apollo/client';
import {
	AdminMembersProfileContainerMemberDocument,
	type AdminMembersProfileContainerMemberFieldsFragment,
} from '../../../../generated.tsx';
import { ComponentQueryLoader } from '@cellix/ui-core';
import type { MembersProfileProps } from './members-profile.tsx';
import { MembersProfile } from './members-profile.tsx';

export interface MembersProfileContainerProps {
	data: {
		id: string;
	};
}

export const MembersProfileContainer: React.FC<
	MembersProfileContainerProps
> = (props) => {
	const {
		data: memberData,
		loading: memberLoading,
		error: memberError,
	} = useQuery(AdminMembersProfileContainerMemberDocument, {
		variables: {
			id: props.data.id,
		},
	});

	const membersProfileProps: MembersProfileProps = {
		data: {
			member: (memberData?.member ??
				{}) as AdminMembersProfileContainerMemberFieldsFragment,
		},
	};

	return (
		<ComponentQueryLoader
			loading={memberLoading}
			hasData={memberData?.member}
			hasDataComponent={<MembersProfile {...membersProfileProps} />}
			error={memberError}
		/>
	);
};
