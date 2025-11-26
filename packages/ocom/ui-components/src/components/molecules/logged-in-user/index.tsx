import { LoggedIn, type LoggedInProps } from './logged-in.tsx';
import { NotLoggedIn } from './not-logged-in.tsx';

export interface LoggedInUserProps {
  data: {
    isLoggedIn: boolean;
    firstName?: string;
    lastName?: string;
    notificationCount?: number;
    profileImage?: string;
  };
  onLoginClicked?: () => void;
  onSignupClicked?: () => void;
  onLogoutClicked?: () => void;
}

export const LoggedInUser: React.FC<LoggedInUserProps> = (props) => {
  const content = () => {
    const dummyFunction = () => {
      return;
    };
    if (props.data.isLoggedIn) {
      const loggedInProps: Partial<LoggedInProps> = {
        data: {
          profileImage: props.data.profileImage ?? '',
          firstName: props.data.firstName ?? '',
          lastName: props.data.lastName ?? '',
          notificationCount: props.data.notificationCount ?? 0
        }
      };

      return <LoggedIn 
        // biome-ignore lint/plugin/no-type-assertion: test file
        data={loggedInProps.data as LoggedInProps['data']} 
        onLogoutClicked={props.onLogoutClicked ?? dummyFunction}
      />
    } else {
      return (
        <NotLoggedIn
          onLoginClicked={props.onLoginClicked ?? dummyFunction}
          onSignupClicked={props.onSignupClicked ?? dummyFunction}
        />
      );
    }
  };

  return <div className={` `}>{content()}</div>
};