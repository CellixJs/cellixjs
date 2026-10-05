import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { Video } from '@ocom/data-sources-mongoose-models/video';
import { Domain } from '@ocom/domain';
import type { VideoDomainAdapter } from './video.domain-adapter.ts';

type VideoModelType = Video;
type PropType = VideoDomainAdapter;

export class VideoRepository extends MongooseSeedwork.MongoRepositoryBase<VideoModelType, PropType, Domain.Passport, Domain.Contexts.Video.Video.Video<PropType>> implements Domain.Contexts.Video.Video.VideoRepository<PropType> {
	/** Loads a video with its community populated, which the video visa needs for permission checks. */
	async getById(id: string): Promise<Domain.Contexts.Video.Video.Video<PropType>> {
		const mongoVideo = await this.model.findById(id).populate('community').exec();
		if (!mongoVideo) {
			throw new Error(`Video with id ${id} not found`);
		}
		return this.typeConverter.toDomain(mongoVideo, this.passport);
	}

	/** Creates a video for a community, awaiting upload. */
	getNewInstance(title: string, source: Domain.Contexts.Video.Video.NewVideoSource, community: Domain.Contexts.Community.Community.CommunityEntityReference): Promise<Domain.Contexts.Video.Video.Video<PropType>> {
		const adapter = this.typeConverter.toAdapter(new this.model());
		const video = Domain.Contexts.Video.Video.Video.getNewInstance(adapter, title, source, community, this.passport);
		return Promise.resolve(video);
	}
}
