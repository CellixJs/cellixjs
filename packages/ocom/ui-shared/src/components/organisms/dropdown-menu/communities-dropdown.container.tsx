import { gql, useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import { CommunitiesDropdown, type CommunitiesDropdownProps } from './communities-dropdown.tsx';

const UI_COMPONENTS_COMMUNITIES_DROPDOWN_MEMBERS = gql(`
	query UiComponentsCommunitiesDropdownMembersForCurrentEndUser {
		membersForCurrentEndUser {
			id
			memberName
			isAdmin
			community {
				id
				name
			}
		}
	}
`);

interface CommunitiesDropdownContainerProps {
	data: {
		id?: string;
	};
}

interface MemberSummary {
	id: string;
	memberName?: string | null;
	isAdmin?: boolean | null;
	community?: {
		id?: string | null;
		name?: string | null;
	} | null;
}

interface MembersForCurrentEndUserQueryData {
	membersForCurrentEndUser: MemberSummary[];
}

export const CommunitiesDropdownContainer: React.FC<CommunitiesDropdownContainerProps> = (_props) => {
	const { data, loading, error } = useQuery<MembersForCurrentEndUserQueryData>(UI_COMPONENTS_COMMUNITIES_DROPDOWN_MEMBERS);

	const communitiesDropdownProps: CommunitiesDropdownProps = {
		data: {
			members: data?.membersForCurrentEndUser ?? [],
		},
	};

	return (
		<ComponentQueryLoader
			loading={loading}
			hasData={data}
			hasDataComponent={<CommunitiesDropdown {...communitiesDropdownProps} />}
			error={error ?? undefined}
		/>
	);
};
