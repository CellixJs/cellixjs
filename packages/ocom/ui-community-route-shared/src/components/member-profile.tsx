import type React from 'react';
import { MemberProfileContainer, type MemberProfileContainerProps } from './member-profile.container.tsx';

export interface MemberProfileProps extends MemberProfileContainerProps {}

export const MemberProfile: React.FC<MemberProfileProps> = (props) => <MemberProfileContainer {...props} />;
