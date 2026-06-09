import type { CommunityPage } from '../community.page.ts';

export type UiCommunityPage = Pick<CommunityPage, 'fillName' | 'clickCreate' | 'firstValidationError' | 'errorToast'>;

export type E2ECommunityPage = Pick<CommunityPage, 'fillName' | 'clickCreate' | 'firstValidationError' | 'errorToast'>;
