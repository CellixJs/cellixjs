export interface VideoDomainPermissions {
	/** Upload videos and change their details. */
	canManageVideos: boolean;
	/** Watch videos that are ready. */
	canViewVideos: boolean;
	/** Record encoding results. Only the system passport has this. */
	isSystemAccount: boolean;
}
