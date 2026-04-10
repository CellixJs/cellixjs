import React from 'react';
import type { AccountsUserInfoContainerEndUserFieldsFragment } from '../../../../../../apps/ui-community/src/generated.js';

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
