import type React from 'react';
import type { AccountsUserInfoContainerEndUserFieldsFragment } from '../generated.tsx';

export type UserInfoProps = {
	userData?: AccountsUserInfoContainerEndUserFieldsFragment;
};

export const UserInfo: React.FC<UserInfoProps> = ({ userData }) => {
	return (
		<div>
			<div data-testid="user-id">User ID: {userData?.id ?? 'Unknown'}</div>
		</div>
	);
};
