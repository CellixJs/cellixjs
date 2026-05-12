import type { CommunityPage } from '../community.page.ts';

export type UiCommunityPage = Pick<CommunityPage, 'fillName' | 'clickCreate'>;

export type E2ECommunityPage = Pick<CommunityPage, 'createCommunityButton' | 'fillName' | 'clickCreate' | 'firstValidationError' | 'errorToast'>;
