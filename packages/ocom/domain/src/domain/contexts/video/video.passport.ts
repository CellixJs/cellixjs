import type { VideoEntityReference } from './video/video.aggregate.ts';
import type { VideoVisa } from './video.visa.ts';

export interface VideoPassport {
	forVideo(root: VideoEntityReference): VideoVisa;
}
