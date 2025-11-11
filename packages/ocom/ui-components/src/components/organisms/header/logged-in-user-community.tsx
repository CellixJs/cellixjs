import { LoggedInUser, type LoggedInUserProps } from "../../molecules/logged-in-user/index.tsx";

export interface LoggedInUserCommunityProps {
  data: {
    communityId: string;
    userCurrent: {
        id: string;
        personalInformation: {
            identityDetails: {
                restOfName: string;
                lastName: string;
            };
        };
    };
    memberForCurrentUser: {
        profile: {
            avatarDocumentId: string;
        };
    };
  };
  handleLogout: () => void;
}

export const LoggedInUserCommunity: React.FC<LoggedInUserCommunityProps> = (props) => {

    const userData: LoggedInUserProps = {
      data: {
        isLoggedIn: true,
        firstName: props.data?.userCurrent?.personalInformation?.identityDetails?.restOfName ?? '',
        lastName: props.data?.userCurrent?.personalInformation?.identityDetails?.lastName ?? '',
        notificationCount: 0,

        profileImage: props.data?.memberForCurrentUser?.profile?.avatarDocumentId
            ? `https://ownercommunity.blob.core.windows.net/${props.data?.communityId}/${props.data?.memberForCurrentUser.profile.avatarDocumentId}`
            : undefined
        }
    };


    return (
      <div className="text-right text-sky-400" style={{ flexGrow: '1' }}>
        <LoggedInUser key={props.data?.userCurrent?.id} data={userData.data} onLogoutClicked={props.handleLogout} />
      </div>
    );
};