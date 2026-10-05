/**
 * Where video files live in Blob Storage (ADR 0036).
 *
 * - Originals: one shared private container, one blob per upload under the
 *   community's id.
 * - Encoded output: one private container per community, one prefix per
 *   video. A playback token covers the whole community container, whose
 *   members may watch all of its videos.
 */
export const VideoUploadContainerName = 'video-uploads';

/** How long a playback token stays valid. */
export const PlaybackTokenLifetimeMs = 2 * 60 * 60 * 1000;

/** How long staff links (source download, output uploads) stay valid. */
export const EncodingLinkLifetimeMs = 6 * 60 * 60 * 1000;

export function videoOutputContainerName(communityId: string): string {
	return `videos-${communityId.toLowerCase()}`;
}

export function videoOutputPrefix(videoId: string): string {
	return `${videoId}/`;
}
