export interface HeaderUiNotes {
	site: 'community' | 'staff';
	identityProviderUnreachable: boolean;
	signinRedirectCalled: boolean;
	consoleErrorCalled: boolean;
	fallbackInvoked: boolean;
}
