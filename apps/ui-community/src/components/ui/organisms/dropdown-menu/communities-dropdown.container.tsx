import { ComponentQueryLoader } from '@ocom/ui-components';
import { useLazyQuery } from '@apollo/client';
import { useEffect, useState } from 'react';
import type { Member, SharedCommunitiesDropdownContainerMembersQuery } from '../../../../generated.tsx';
import { SharedCommunitiesDropdownContainerMembersDocument } from '../../../../generated.tsx';
import { CommunitiesDropdown } from './communities-dropdown.tsx';

interface CommunitiesDropdownContainerProps {
	data: {
		id?: string;
	};
}

export const CommunitiesDropdownContainer: React.FC<CommunitiesDropdownContainerProps> = (_props) => {
	const [memberQuery] = useLazyQuery(SharedCommunitiesDropdownContainerMembersDocument);
	const [membersData, setMemberData] = useState<SharedCommunitiesDropdownContainerMembersQuery | null>(null);
	const [membersError, setMemberError] = useState<Error | null>(null);
	const [membersLoading, setMemberLoading] = useState<boolean>(true);

	useEffect(() => {
		const getData = async () => {
			try {
				const { data: membersDataTemp, loading: membersLoadingTemp, error: membersErrorTemp } = await memberQuery();
				setMemberData(membersDataTemp ?? null);
				setMemberError(membersErrorTemp ?? null);
				setMemberLoading(membersLoadingTemp);
			} catch (e) {
				console.error('Error getting data in community dropdown: ', e);
				setMemberError(e instanceof Error ? e : new Error('Unknown error'));
				setMemberLoading(false);
			}
		};
		getData();
	}, [memberQuery]);

	return (
		<ComponentQueryLoader
			loading={membersLoading}
			hasData={membersData}
			hasDataComponent={
				<CommunitiesDropdown
					data={{
						members: (membersData?.membersForCurrentEndUser as Member[]) ?? [],
					}}
				/>
			}
			error={membersError}
		/>
	);
};
