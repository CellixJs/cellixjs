import type { CommunityPage, HomePage } from '@ocom-verification/verification-shared/pages';

export type E2EHomePage = Pick<HomePage, 'clickSignIn' | 'signInButton'>;

export type E2ECommunityPage = Pick<CommunityPage, 'fillName' | 'clickCreate' | 'firstValidationError' | 'errorToast'>;
