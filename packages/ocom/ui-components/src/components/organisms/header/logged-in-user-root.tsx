import type { LoggedInUserContainerEndUserFieldsFragment } from "../../../generated.tsx";
import { LoggedInUser, type LoggedInUserProps } from "../../molecules/logged-in-user/index.tsx";

export interface LoggedInUserRootProps {
    userData: LoggedInUserContainerEndUserFieldsFragment;
    handleLogout: () => void;
}

export const LoggedInUserRoot: React.FC<LoggedInUserRootProps> = (props) => {
    // Add more explicit handling for null values to improve branch coverage
    const firstName = props.userData?.personalInformation?.identityDetails?.restOfName;
    const lastName = props.userData?.personalInformation?.identityDetails?.lastName;

    const userData: LoggedInUserProps = {
      data: {
        isLoggedIn: true,
        firstName: firstName || '',  // Use explicit OR instead of nullish coalescing
        lastName: lastName || '',    // Use explicit OR instead of nullish coalescing
        notificationCount: 0
      }
    };
    return (
      <div className="text-right text-sky-400 flex-grow">
        <LoggedInUser key={props.userData?.id} data={userData.data} onLogoutClicked={props.handleLogout} />
      </div>
    );
}