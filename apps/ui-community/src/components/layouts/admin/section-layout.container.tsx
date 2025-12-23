import type { ApolloError } from '@apollo/client';
import { useLazyQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
	type AdminSectionLayoutContainerMemberFieldsFragment,
	AdminSectionLayoutContainerMembersForCurrentEndUserDocument,
	type Member,
} from '../../../generated.tsx';
import type { PageLayoutProps } from './index.tsx';
import { SectionLayout } from './section-layout.tsx';

interface SectionLayoutContainerProps {
	pageLayouts: PageLayoutProps[];
}

interface MemberDataState {
	member: AdminSectionLayoutContainerMemberFieldsFragment;
}

export const SectionLayoutContainer: React.FC<SectionLayoutContainerProps> = (
	props,
) => {
	const params = useParams();

	const [memberQuery] = useLazyQuery(
		AdminSectionLayoutContainerMembersForCurrentEndUserDocument,
	);
	const [memberData, setMemberData] = useState<MemberDataState | null>(null);
	const [memberError, setMemberError] = useState<ApolloError | undefined>(
		undefined,
	);
	const [memberLoading, setMemberLoading] = useState<boolean>(false);

	useEffect(() => {
		const getData = async () => {
			try {
				const {
					data: membersDataTemp,
					loading: memberLoadingTemp,
					error: memberErrorTemp,
				} = await memberQuery();

				// Filter for the current member by memberId
				const currentMember = membersDataTemp?.membersForCurrentEndUser?.find(
					(m: AdminSectionLayoutContainerMemberFieldsFragment) =>
						m.id === params['memberId'],
				);

				setMemberData(currentMember ? { member: currentMember } : null);
				setMemberError(memberErrorTemp);
				setMemberLoading(memberLoadingTemp);
			} catch (e) {
				console.error('Error fetching data in section layout: ', e);
			}
		};
		getData();
	}, [params, memberQuery]);

	return (
		<ComponentQueryLoader
			loading={memberLoading}
			hasData={memberData}
			hasDataComponent={
				<SectionLayout
					pageLayouts={props.pageLayouts}
					memberData={memberData?.member as Member}
				/>
			}
			error={memberError}
		/>
	);
};
