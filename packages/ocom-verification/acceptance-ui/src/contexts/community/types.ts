/**
 * Notes shared between steps during a community-creation UI test.
 */
export interface CommunityUiNotes {
	communityName: string;
	container: HTMLElement;
	formSubmitted: boolean;
	lastValidationError: string;
}
