import { useParams } from 'react-router-dom';
import { LoggedInUserCommunityContainer } from './logged-in-user-community.container.tsx';
import { LoggedInUserRootContainer } from './logged-in-user-root.container.tsx';

interface ComponentPropInterface {
  autoLogin: boolean;
}

export const LoggedInUserContainer: React.FC<ComponentPropInterface> = (props) => {
  const { communityId } = useParams();

  return (
    <>
      {communityId ? (
        <LoggedInUserCommunityContainer autoLogin={props.autoLogin} />
      ) : (
        <LoggedInUserRootContainer autoLogin={props.autoLogin} />
      )}
    </>
  );
};
