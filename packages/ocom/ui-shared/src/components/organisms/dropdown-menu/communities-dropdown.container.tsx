import { useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import { CommunitiesDropdownContainerMembersForCurrentEndUserDocument } from '../../../generated.tsx';
import { CommunitiesDropdown, type CommunitiesDropdownProps } from './communities-dropdown.tsx';

interface CommunitiesDropdownContainerProps {
	data: {
		id?: string;
	};
}

export const CommunitiesDropdownContainer: React.FC<CommunitiesDropdownContainerProps> = (_props) => {
	const { data, loading, error } = useQuery(CommunitiesDropdownContainerMembersForCurrentEndUserDocument);

	const communitiesDropdownProps: CommunitiesDropdownProps = {
		data: {
			currentEndUserId: data?.currentEndUserAndCreateIfNotExists?.id ?? null,
			members:
				data?.membersForCurrentEndUser.map((member) => ({
					id: member.id,
					memberName: member.memberName,
					isAdmin: member.isAdmin,
					accounts: member.accounts?.map((account) => ({
						statusCode: account?.statusCode,
						user: account?.user ? { id: account.user.id } : null,
					})),
					role: member.role
						? {
								permissions: {
									propertyPermissions: {
										canManageProperties: member.role.permissions?.propertyPermissions?.canManageProperties,
									},
								},
							}
						: null,
					community: member.community
						? {
								id: member.community.id,
								name: member.community.name,
							}
						: null,
				})) ?? [],
		},
	};

	return (
		<ComponentQueryLoader
			loading={loading}
			hasData={data}
			hasDataComponent={<CommunitiesDropdown {...communitiesDropdownProps} />}
			error={error ?? undefined}
		/>
	);
};
