import type { LoginPage } from '../login.page.ts';

export type UiLoginPage = Pick<LoginPage, never>;

export type E2ELoginPage = Pick<LoginPage, 'goto' | 'login' | 'waitForRedirectComplete'>;
