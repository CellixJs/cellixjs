import type { CommunityPage, HomePage } from '@ocom-verification/verification-shared/pages';

export type AcceptanceUiHomePage = Pick<HomePage, 'clickSignIn' | 'signInButton'>;

export type AcceptanceUiCommunityPage = Pick<CommunityPage, 'fillName' | 'clickCreate' | 'firstValidationError' | 'errorToast'>;
