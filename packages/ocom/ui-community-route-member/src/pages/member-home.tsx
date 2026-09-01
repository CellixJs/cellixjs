import { useQuery } from '@apollo/client';
import { Helmet } from '@dr.pogodin/react-helmet';
import { Button, Result } from 'antd';
import type React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { resolveMemberPropertiesAccess } from '../components/member-properties-access-policy.ts';
import { MemberPropertiesRouteGuardMembersForCurrentEndUserDocument } from '../generated.tsx';

/** A neutral member landing with a permission-gated entry into Properties. */
export const MemberHome: React.FC = () => {
	const navigate = useNavigate();
	const { communityId, memberId } = useParams<{ communityId?: string; memberId?: string }>();
	const { data } = useQuery(MemberPropertiesRouteGuardMembersForCurrentEndUserDocument, {
		skip: !communityId || !memberId,
	});
	const accessDecision = resolveMemberPropertiesAccess(data?.membersForCurrentEndUser, data?.currentEndUserAndCreateIfNotExists?.id, communityId, memberId);
	const propertiesDestination = accessDecision === 'allowed' ? 'properties' : accessDecision === 'manager-redirect' && communityId && memberId ? `/community/${communityId}/admin/${memberId}/properties` : undefined;

	return (
		<>
			<Helmet>
				<title>Community Member</title>
			</Helmet>
			<Result
				status="info"
				title="Community Member"
				subTitle="Welcome to your community portal."
				extra={
					propertiesDestination ? (
						<Button
							type="primary"
							onClick={() => navigate(propertiesDestination)}
						>
							{accessDecision === 'manager-redirect' ? 'Manage Properties' : 'Properties'}
						</Button>
					) : undefined
				}
			/>
		</>
	);
};
