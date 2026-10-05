import type { Repository } from '@cellix/domain-seedwork/repository';
import type { CommunityEntityReference } from '../../community/community/community.ts';
import type { NewVideoSource, Video, VideoProps } from './video.aggregate.ts';

export interface VideoRepository<props extends VideoProps> extends Repository<Video<props>> {
	getNewInstance(title: string, source: NewVideoSource, community: CommunityEntityReference): Promise<Video<props>>;
	getById(id: string): Promise<Video<props>>;
}
