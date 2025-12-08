// @ts-ignore [TS7]
import { Typography } from 'antd';
import type { AccountsUserInfoContainerEndUserFieldsFragment } from '../../../../generated.tsx';

export interface UserInfoProps {
   userData: AccountsUserInfoContainerEndUserFieldsFragment;
}

export const UserInfo: React.FC<UserInfoProps> = (props) => {
  return (
    <Typography.Paragraph data-testid="user-id">
      User ID: {props.userData.id} <br />
    </Typography.Paragraph>
  );
};
