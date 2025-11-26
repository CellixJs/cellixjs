import { useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import {
  AccountsCommunityListContainerCommunitiesForCurrentEndUserDocument,
  type AccountsCommunityListContainerCommunityFieldsFragment,
  type AccountsCommunityListContainerMemberFieldsFragment,
  AccountsCommunityListContainerMembersForCurrentEndUserDocument,
} from '../../../../generated.tsx';
import { CommunityList } from './community-list.tsx';

export const CommunityListContainer: React.FC = () => {
  const {
    loading: communityLoading,
    error: communityError,
    data: communityData
  } = useQuery(AccountsCommunityListContainerCommunitiesForCurrentEndUserDocument);

  const {
    loading: membersLoading,
    error: membersError,
    data: membersData
  } = useQuery(AccountsCommunityListContainerMembersForCurrentEndUserDocument, {
    fetchPolicy: 'network-only'
  });

  const members: AccountsCommunityListContainerMemberFieldsFragment[][] = [];
  if (
    membersData?.membersForCurrentEndUser &&
    membersData?.membersForCurrentEndUser.length > 0 &&
    communityData?.communitiesForCurrentEndUser
  ) {
    for (const community of communityData.communitiesForCurrentEndUser) {
      members.push(
        membersData.membersForCurrentEndUser.filter((member: AccountsCommunityListContainerMemberFieldsFragment) => member?.community?.id === community?.id)
      );
    }
  }

  return (
    <ComponentQueryLoader
      loading={communityLoading || membersLoading}
      hasData={communityData?.communitiesForCurrentEndUser && members}
      hasDataComponent={
        <CommunityList 
            data={{ 
                // biome-ignore lint/plugin/no-type-assertion: test file
                communities: communityData?.communitiesForCurrentEndUser as AccountsCommunityListContainerCommunityFieldsFragment[],
                // biome-ignore lint/plugin/no-type-assertion: test file
                members: members as AccountsCommunityListContainerMemberFieldsFragment[][]
            }} 
        />}
      noDataComponent={<div>No Data...</div>}
      error={communityError || membersError}
      errorComponent={
        communityError ? (
          <div>Error :( {JSON.stringify(communityError)}</div>
        ) : (
          <div>Error :( {JSON.stringify(membersError)}</div>
        )
      }
    />
  );
};
