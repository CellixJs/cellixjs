import { Button } from 'antd';
import type { FC } from 'react';

export interface NotLoggedInProps {
  onLoginClicked: () => void;
  onSignupClicked: () => void;
}

export const NotLoggedIn: FC<NotLoggedInProps> = (props) => {
  
  return <>
    <Button onClick={props.onLoginClicked}>Login</Button>
    <Button onClick={props.onSignupClicked}>Sign up</Button>
  </>
}
