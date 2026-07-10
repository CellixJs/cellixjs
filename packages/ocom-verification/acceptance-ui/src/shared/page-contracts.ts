import type { CommunityPage, HomePage, MemberCreatePage } from '@ocom-verification/verification-shared/pages';

export type AcceptanceUiHomePage = Pick<HomePage, 'clickSignIn' | 'signInButton'>;

export type AcceptanceUiCommunityPage = Pick<CommunityPage, 'fillName' | 'clickCreate' | 'firstValidationError' | 'errorToast'>;

export type AcceptanceUiMemberCreatePage = Pick<MemberCreatePage, 'fillMemberName' | 'clickCreateMember' | 'firstValidationError' | 'errorToast'>;
