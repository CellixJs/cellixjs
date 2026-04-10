import { useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import { useParams } from 'react-router-dom';
import { AdminSectionLayoutContainerMembersForCurrentEndUserDocument, type Member } from '../../../../../apps/ui-community/src/generated.js';
import type { PageLayoutProps } from './index.js';
import { SectionLayout } from './section-layout.js';

interface SectionLayoutContainerProps {
	pageLayouts: PageLayoutProps[];
}

export const SectionLayoutContainer: React.FC<SectionLayoutContainerProps> = (props) => {
	const params = useParams();

	const { data: membersData, loading: membersLoading, error: membersError } = useQuery(AdminSectionLayoutContainerMembersForCurrentEndUserDocument);

	return (
		<ComponentQueryLoader
			loading={membersLoading}
			hasData={membersData?.membersForCurrentEndUser}
			hasDataComponent={
				<SectionLayout
					pageLayouts={props.pageLayouts}
					// biome-ignore lint:useLiteralKeys
					memberData={membersData?.membersForCurrentEndUser.find((member) => member.id === params['memberId']) as Member}
				/>
			}
			error={membersError}
		/>
	);
};
