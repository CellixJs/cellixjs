import { useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import { Result } from 'antd';
import type React from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { MemberPropertiesRouteGuardMembersForCurrentEndUserDocument } from '../generated.tsx';
import { MemberPropertiesAccessProvider } from './member-properties-access.context.ts';
import { resolveMemberPropertiesAccess } from './member-properties-access-policy.ts';

interface MemberPropertiesRouteGuardContainerProps {
	children: React.ReactNode;
}

const deniedResult = (
	<Result
		className="member-property-route-forbidden"
		status="403"
		title="403"
		subTitle="Access denied to Properties for this community."
	/>
);

/**
 * Validates the current authenticated membership before any Property request
 * mounts. Property managers are deliberately redirected to their equivalent
 * manager route so their all-owner controls remain available.
 */
export const MemberPropertiesRouteGuardContainer: React.FC<MemberPropertiesRouteGuardContainerProps> = (props) => {
	const params = useParams<{ communityId?: string; memberId?: string }>();
	const location = useLocation();
	const { data, loading, error, refetch } = useQuery(MemberPropertiesRouteGuardMembersForCurrentEndUserDocument, {
		fetchPolicy: 'network-only',
	});

	const accessDecision = resolveMemberPropertiesAccess(data?.membersForCurrentEndUser, data?.currentEndUserAndCreateIfNotExists?.id, params.communityId, params.memberId);

	const memberPropertiesPath = params.communityId && params.memberId ? `/community/${params.communityId}/member/${params.memberId}/properties` : undefined;
	const remainingPath = memberPropertiesPath && location.pathname.startsWith(memberPropertiesPath) ? location.pathname.slice(memberPropertiesPath.length) : '';
	const managerRedirectPath = params.communityId && params.memberId ? `/community/${params.communityId}/admin/${params.memberId}/properties${remainingPath}${location.search}${location.hash}` : '/community/accounts';

	const allowedContent =
		accessDecision === 'manager-redirect' ? (
			<Navigate
				replace
				to={managerRedirectPath}
			/>
		) : accessDecision === 'allowed' && params.communityId && params.memberId ? (
			<MemberPropertiesAccessProvider
				value={{
					communityId: params.communityId,
					memberId: params.memberId,
					revalidate: async () => refetch(),
				}}
			>
				{props.children}
			</MemberPropertiesAccessProvider>
		) : (
			deniedResult
		);

	return (
		<ComponentQueryLoader
			loading={loading}
			hasData={data?.membersForCurrentEndUser}
			hasDataComponent={allowedContent}
			error={error}
		/>
	);
};
