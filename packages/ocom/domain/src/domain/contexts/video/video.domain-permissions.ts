export interface VideoDomainPermissions {
	/** Upload videos and change their details. */
	canManageVideos: boolean;
	/** Start encoding uploaded videos and record their results. Granted to staff with `canEncodeVideos`. */
	canEncodeVideos: boolean;
	/** Watch videos that are ready. */
	canViewVideos: boolean;
	/** Marks the system passport. */
	isSystemAccount: boolean;
}
