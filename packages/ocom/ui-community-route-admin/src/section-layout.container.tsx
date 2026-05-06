import { useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import type { PageLayoutProps } from '@ocom/ui-shared';
import { useParams } from 'react-router-dom';
import {
	AdminSectionLayoutContainerCurrentStaffUserDocument,
	AdminSectionLayoutContainerMembersForCurrentEndUserDocument,
	type Member,
} from './generated.tsx';
import { SectionLayout } from './section-layout.tsx';

interface SectionLayoutContainerProps {
	pageLayouts: PageLayoutProps[];
}

export const SectionLayoutContainer: React.FC<SectionLayoutContainerProps> = (props) => {
	const params = useParams();

	const { data: membersData, loading: membersLoading, error: membersError } = useQuery(AdminSectionLayoutContainerMembersForCurrentEndUserDocument);
	const { data: staffUserData } = useQuery(AdminSectionLayoutContainerCurrentStaffUserDocument);

	const staffSectionPermissions = staffUserData?.currentStaffUserAndCreateIfNotExists?.role?.permissions?.sectionPermissions ?? null;

	return (
		<ComponentQueryLoader
			loading={membersLoading}
			hasData={membersData?.membersForCurrentEndUser}
			hasDataComponent={
				<SectionLayout
					pageLayouts={props.pageLayouts}
					// biome-ignore lint:useLiteralKeys
					memberData={membersData?.membersForCurrentEndUser.find((member) => member.id === params['memberId']) as Member}
					staffSectionPermissions={staffSectionPermissions}
				/>
			}
			error={membersError}
		/>
	);
};
