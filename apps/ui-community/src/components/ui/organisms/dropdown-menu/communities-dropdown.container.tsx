import { useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import type {
	Member,
} from '../../../../generated.tsx';
import { SharedCommunitiesDropdownContainerMembersDocument } from '../../../../generated.tsx';
import { CommunitiesDropdown, type CommunitiesDropdownProps } from './communities-dropdown.tsx';

interface CommunitiesDropdownContainerProps {
	data: {
		id?: string;
	};
}

export const CommunitiesDropdownContainer: React.FC<
	CommunitiesDropdownContainerProps
> = (_props) => {
	const { data, loading, error } = useQuery(
		SharedCommunitiesDropdownContainerMembersDocument,
	);

    const communitiesDropdownProps: CommunitiesDropdownProps = {
		data: {
			members: (data?.membersForCurrentEndUser as Member[]) ?? [],
		},
	};

	return (
		<ComponentQueryLoader
			loading={loading}
			hasData={data}
			hasDataComponent={
				<CommunitiesDropdown
                    {...communitiesDropdownProps}
				/>
			}
			error={error ?? undefined}
		/>
	);
};
