import { useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import { Result } from 'antd';
import type React from 'react';
import { useParams } from 'react-router-dom';
import { AdminSectionLayoutContainerMembersForCurrentEndUserDocument } from '../generated.tsx';

interface NonPropertyAdminRouteGuardContainerProps {
	children: React.JSX.Element;
}

/**
 * Route-level guard for the admin sections reserved for full (non-property)
 * administrators, such as Members and Settings. Hiding the navigation entries
 * is not enough: without this guard a property-only manager could deep link
 * straight to the Members URL and reach member-management data. Mirrors the
 * menu gating by requiring the role's `isNonPropertyAdmin` flag, and denies
 * member ids that do not belong to the community in the route so one
 * community's member id cannot unlock another community's route.
 */
export const NonPropertyAdminRouteGuardContainer: React.FC<NonPropertyAdminRouteGuardContainerProps> = (props) => {
	const params = useParams<{ communityId?: string; memberId?: string }>();

	const { data: membersData, loading: membersLoading, error: membersError } = useQuery(AdminSectionLayoutContainerMembersForCurrentEndUserDocument);

	const currentMember = membersData?.membersForCurrentEndUser.find((member) => String(member.id) === params.memberId && String(member.community?.id) === params.communityId);
	const isNonPropertyAdmin = currentMember?.role?.permissions?.isNonPropertyAdmin ?? false;

	return (
		<ComponentQueryLoader
			loading={membersLoading}
			hasData={membersData?.membersForCurrentEndUser}
			hasDataComponent={
				isNonPropertyAdmin ? (
					props.children
				) : (
					<Result
						status="403"
						title="403"
						subTitle="Sorry, you are not authorized to administer this community."
					/>
				)
			}
			error={membersError}
		/>
	);
};
