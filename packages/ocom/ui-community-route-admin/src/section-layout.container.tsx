import { useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import type { PageLayoutProps } from '@ocom/ui-shared';
import { useParams } from 'react-router-dom';
import { AdminSectionLayoutContainerMembersForCurrentEndUserDocument, type Member } from './generated.tsx';
import { SectionLayout } from './section-layout.tsx';

interface SectionLayoutContainerProps {
	pageLayouts: PageLayoutProps[];
}

export const SectionLayoutContainer: React.FC<SectionLayoutContainerProps> = (props) => {
	const params = useParams();

	const { data: membersData, loading: membersLoading, error: membersError } = useQuery(AdminSectionLayoutContainerMembersForCurrentEndUserDocument);

	const members = membersData?.membersForCurrentEndUser;
	// biome-ignore lint:useLiteralKeys
	const memberId = params['memberId'];
	// biome-ignore lint:useLiteralKeys
	const communityId = params['communityId'];
	// A route may address the acting member indirectly (for example `.../admin/current/...`),
	// so fall back to the end user's member in the community currently being administered.
	const memberData = (members?.find((member) => member.id === memberId) ?? members?.find((member) => member.community?.id === communityId)) as Member;

	return (
		<ComponentQueryLoader
			loading={membersLoading}
			hasData={membersData?.membersForCurrentEndUser}
			hasDataComponent={
				<SectionLayout
					pageLayouts={props.pageLayouts}
					memberData={memberData}
				/>
			}
			error={membersError}
		/>
	);
};
