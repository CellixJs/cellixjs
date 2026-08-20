import { useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import { hasAcceptedAccountForUser } from '@ocom/ui-shared';
import { Result } from 'antd';
import type React from 'react';
import { useParams } from 'react-router-dom';
import { AdminSectionLayoutContainerMembersForCurrentEndUserDocument } from '../generated.tsx';

interface PropertiesRouteGuardContainerProps {
	children: React.JSX.Element;
}

/**
 * Route-level guard for the admin Properties section. Denies deep links when
 * the current member's role does not grant the manage-properties permission,
 * when the current user's account on that member is not ACCEPTED — mirroring
 * the backend's active-account requirement — or when the member does not
 * belong to the community in the route, so one community's member id cannot
 * unlock another community's route.
 */
export const PropertiesRouteGuardContainer: React.FC<PropertiesRouteGuardContainerProps> = (props) => {
	const params = useParams<{ communityId?: string; memberId?: string }>();

	const { data: membersData, loading: membersLoading, error: membersError } = useQuery(AdminSectionLayoutContainerMembersForCurrentEndUserDocument);

	const currentMember = membersData?.membersForCurrentEndUser.find((member) => String(member.id) === params.memberId && String(member.community?.id) === params.communityId);
	const canManageProperties = currentMember?.role?.permissions?.propertyPermissions?.canManageProperties ?? false;
	const hasActiveAccount = hasAcceptedAccountForUser(currentMember?.accounts, membersData?.currentEndUserAndCreateIfNotExists?.id);

	return (
		<ComponentQueryLoader
			loading={membersLoading}
			hasData={membersData?.membersForCurrentEndUser}
			hasDataComponent={
				canManageProperties && hasActiveAccount ? (
					props.children
				) : (
					<Result
						status="403"
						title="403"
						subTitle="Sorry, you are not authorized to manage properties for this community."
					/>
				)
			}
			error={membersError}
		/>
	);
};
