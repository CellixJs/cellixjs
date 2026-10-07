import type { Repository } from '@cellix/domain-seedwork/repository';
import type { VideoEntityReference } from '../video/video.aggregate.ts';
import type { VideoViewing, VideoViewingProps } from './video-viewing.aggregate.ts';

export interface VideoViewingRepository<props extends VideoViewingProps> extends Repository<VideoViewing<props>> {
	getNewInstance(video: VideoEntityReference, memberId: string, now: Date): Promise<VideoViewing<props>>;
	/** A member's viewing of a video, or `undefined` when they have not started watching it. */
	getByVideoAndMember(videoId: string, memberId: string): Promise<VideoViewing<props> | undefined>;
}
