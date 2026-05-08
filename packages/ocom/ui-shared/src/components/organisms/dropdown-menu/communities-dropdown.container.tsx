import { useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import { CommunitiesDropdownContainerMembersForCurrentEndUserDocument } from '../../../generated.tsx';
import { CommunitiesDropdown, type CommunitiesDropdownProps } from './communities-dropdown.tsx';

interface CommunitiesDropdownContainerProps {
	data: {
		id?: string;
	};
}

export const CommunitiesDropdownContainer: React.FC<CommunitiesDropdownContainerProps> = (_props) => {
	const { data, loading, error } = useQuery(CommunitiesDropdownContainerMembersForCurrentEndUserDocument);

	const communitiesDropdownProps: CommunitiesDropdownProps = {
		data: {
			members:
				data?.membersForCurrentEndUser.map((member) => ({
					id: member.id,
					memberName: member.memberName,
					isAdmin: member.isAdmin,
					community: member.community
						? {
								id: member.community.id,
								name: member.community.name,
							}
						: null,
				})) ?? [],
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
