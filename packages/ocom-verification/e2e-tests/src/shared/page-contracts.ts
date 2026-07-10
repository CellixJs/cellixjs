import type { CommunityPage, HomePage, MemberCreatePage, MemberProfilePage } from '@ocom-verification/verification-shared/pages';

export type E2EHomePage = Pick<HomePage, 'clickSignIn' | 'signInButton'>;

export type E2ECommunityPage = Pick<CommunityPage, 'fillName' | 'clickCreate' | 'firstValidationError' | 'errorToast'>;

export type E2EMemberCreatePage = Pick<MemberCreatePage, 'fillMemberName' | 'clickCreateMember' | 'firstValidationError' | 'errorToast'>;

export type E2EMemberProfilePage = Pick<
	MemberProfilePage,
	'clickEditProfile' | 'clickSaveProfile' | 'fillDisplayName' | 'fillEmail' | 'fillBio' | 'setShowInterests' | 'setShowEmail' | 'setShowProfile' | 'setShowLocation' | 'setShowProperties' | 'firstValidationError' | 'errorToast'
>;
