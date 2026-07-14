import type { CommunityPage, HomePage, MemberAccountsPage, MemberCreatePage, MemberListPage, MemberProfilePage } from '@ocom-verification/verification-shared/pages';

export type AcceptanceUiHomePage = Pick<HomePage, 'clickSignIn' | 'signInButton'>;

export type AcceptanceUiCommunityPage = Pick<CommunityPage, 'fillName' | 'clickCreate' | 'firstValidationError' | 'errorToast'>;

export type AcceptanceUiMemberCreatePage = Pick<MemberCreatePage, 'fillMemberName' | 'clickCreateMember' | 'firstValidationError' | 'errorToast'>;

export type AcceptanceUiMemberListPage = Pick<MemberListPage, 'clickRemoveMember' | 'searchByMemberName'>;

export type AcceptanceUiMemberAccountsPage = Pick<MemberAccountsPage, 'selectEndUser' | 'clickAddMemberAccount'>;

export type AcceptanceUiMemberProfilePage = Pick<
	MemberProfilePage,
	'clickEditProfile' | 'clickSaveProfile' | 'fillDisplayName' | 'fillEmail' | 'fillBio' | 'setShowInterests' | 'setShowEmail' | 'setShowProfile' | 'setShowLocation' | 'setShowProperties'
>;
