import { Typography } from 'antd';
import type { AccountsUserInfoContainerEndUserFieldsFragment } from '../../../../generated';

export interface CommunityListProps {
   userData: AccountsUserInfoContainerEndUserFieldsFragment;
}

export const UserInfo: React.FC<CommunityListProps> = (props) => {
  return (
    <Typography.Paragraph data-testid="user-id">
      User ID: {props.userData.id} <br />
    </Typography.Paragraph>
  );
};
