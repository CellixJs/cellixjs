import { useApolloClient } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import { Skeleton } from 'antd';
import { useAuth } from 'react-oidc-context';
import { useParams } from 'react-router-dom';
import { HandleLogout } from './handle-logout.tsx';
import { LoggedInUserCommunity } from './logged-in-user-community.tsx';

export interface LoggedInUserCommunityContainerProps {
  autoLogin: boolean;
}

export const LoggedInUserCommunityContainer: React.FC<LoggedInUserCommunityContainerProps> = () => {
  const auth = useAuth();
  const apolloClient = useApolloClient();
  const params = useParams();

    const loading = false;
    let error: Error | undefined;
    const data = {
        userCurrent: {
            id: '1',
            personalInformation: {
                identityDetails: {
                    restOfName: 'John',
                    lastName: 'Doe'
                }
            }
        },
        memberForCurrentUser: {
            profile: {
                avatarDocumentId: 'avatar-id'
            }
        }
    };
    const handleLogout = () => {
        HandleLogout(auth, apolloClient, window.location.origin);
    };

    return (
        <ComponentQueryLoader
            loading={loading}
            hasData={data?.userCurrent && data.memberForCurrentUser}
            hasDataComponent={
                <LoggedInUserCommunity
                    data={{
                        // biome-ignore lint:useLiteralKeys: noPropertyAccessFromIndexSignature: true so must use bracket notation for unknown properties
                        communityId: params['communityId'] as string,
                        userCurrent: data?.userCurrent,
                        memberForCurrentUser: data?.memberForCurrentUser,
                    }}
                    handleLogout={handleLogout}
                />
            }
            error={error}
            noDataComponent={<Skeleton loading />}
        />
    );
};
