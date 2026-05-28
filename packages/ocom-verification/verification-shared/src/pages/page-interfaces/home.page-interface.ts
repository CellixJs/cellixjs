import type { HomePage } from '../home.page.ts';

export type UiHomePage = Pick<HomePage, 'clickSignIn' | 'signInButton'>;

export type E2EHomePage = Pick<HomePage, 'clickSignIn' | 'signInButton'>;
