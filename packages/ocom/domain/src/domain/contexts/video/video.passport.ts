import type { VideoEntityReference } from './video/video.aggregate.ts';
import type { VideoVisa } from './video.visa.ts';
import type { VideoViewingEntityReference } from './video-viewing/video-viewing.aggregate.ts';

export interface VideoPassport {
	forVideo(root: VideoEntityReference): VideoVisa;
	forVideoViewing(root: VideoViewingEntityReference): VideoVisa;
}
