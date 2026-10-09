export interface CommunityDetails {
	name: string;
}

/** Settings fields accepted by community update flows (all optional). */
export interface CommunitySettingsDetails {
	name?: string;
	domain?: string;
	whiteLabelDomain?: string;
	handle?: string;
}

export interface CommunityNotes {
	lastCommunityStatus: string;
	lastCommunityName: string;
	lastCommunityId: string;
	lastValidationError: string;
	lastViewedCommunityName: string;
}
