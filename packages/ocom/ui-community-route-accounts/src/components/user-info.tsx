import { UserInfoDescription } from '@ocom/ui-community-shared';
import type { AccountsUserInfoContainerEndUserFieldsFragment } from '../generated.tsx';

export type UserInfoProps = {
	userData?: AccountsUserInfoContainerEndUserFieldsFragment;
};

export const UserInfo: React.FC<UserInfoProps> = ({ userData }) => {
	return <UserInfoDescription label="User ID" value={userData?.id ?? undefined} />;
};
