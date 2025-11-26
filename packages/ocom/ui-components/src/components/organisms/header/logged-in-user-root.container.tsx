import { useApolloClient, useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import { useAuth } from 'react-oidc-context';
import { LoggedInUserRootContainerCurrentEndUserAndCreateIfNotExistsDocument, type LoggedInUserContainerEndUserFieldsFragment } from '../../../generated.tsx';
import { HandleLogout } from './handle-logout.tsx';
import { LoggedInUserRoot } from './logged-in-user-root.tsx';


export interface LoggedInUserRootContainerProps {
  autoLogin: boolean;
}

export const LoggedInUserRootContainer: React.FC<LoggedInUserRootContainerProps> = () => {
  const auth = useAuth();
  const apolloClient = useApolloClient();

  const { loading, error, data } = useQuery(LoggedInUserRootContainerCurrentEndUserAndCreateIfNotExistsDocument);

  const handleLogout = () => {
    HandleLogout(auth, apolloClient, window.location.origin);
  };
  return (
    <ComponentQueryLoader
      loading={loading}
      hasData={data?.currentEndUserAndCreateIfNotExists}
      hasDataComponent={
        // biome-ignore lint/plugin/no-type-assertion: test file
        <LoggedInUserRoot userData={data?.currentEndUserAndCreateIfNotExists as LoggedInUserContainerEndUserFieldsFragment} handleLogout={handleLogout} />
      }
      error={error}
      noDataComponent={<div>No Data</div>}
    />
  );
};
