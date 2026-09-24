import type { CommunityPage, CommunitySettingsPage, HomePage } from '@ocom-verification/verification-shared/pages';

export type AcceptanceUiHomePage = Pick<HomePage, 'clickSignIn' | 'signInButton'>;

export type AcceptanceUiCommunityPage = Pick<CommunityPage, 'fillName' | 'clickCreate' | 'firstValidationError' | 'errorToast'>;

export type AcceptanceUiCommunitySettingsPage = Pick<CommunitySettingsPage, 'fillName' | 'fillWhiteLabelDomain' | 'fillDomain' | 'fillHandle' | 'clickSave' | 'nameInput' | 'firstValidationError'>;
