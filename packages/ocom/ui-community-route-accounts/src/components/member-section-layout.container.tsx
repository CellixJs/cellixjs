import { useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import type { PageLayoutProps } from '@ocom/ui-shared';
import { useParams } from 'react-router-dom';
import { type MemberSectionLayoutContainerMemberFieldsFragment, MemberSectionLayoutContainerMembersForCurrentEndUserDocument } from '../generated.tsx';
import { MemberSectionLayout } from '../member-section-layout.tsx';

interface MemberSectionLayoutContainerProps {
	pageLayouts: PageLayoutProps[];
}

export const MemberSectionLayoutContainer: React.FC<MemberSectionLayoutContainerProps> = (props) => {
	const params = useParams();

	const { data: membersData, loading: membersLoading, error: membersError } = useQuery(MemberSectionLayoutContainerMembersForCurrentEndUserDocument);

	return (
		<ComponentQueryLoader
			loading={membersLoading}
			hasData={membersData?.membersForCurrentEndUser}
			hasDataComponent={
				<MemberSectionLayout
					pageLayouts={props.pageLayouts}
					// biome-ignore lint:useLiteralKeys
					memberData={membersData?.membersForCurrentEndUser.find((member: MemberSectionLayoutContainerMemberFieldsFragment) => member.id === params['memberId']) as MemberSectionLayoutContainerMemberFieldsFragment}
				/>
			}
			error={membersError}
		/>
	);
};
