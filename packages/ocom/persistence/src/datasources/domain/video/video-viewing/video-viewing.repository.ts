import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { VideoViewing } from '@ocom/data-sources-mongoose-models/video-viewing';
import { Domain } from '@ocom/domain';
import type { VideoViewingDomainAdapter } from './video-viewing.domain-adapter.ts';

type PropType = VideoViewingDomainAdapter;

export class VideoViewingRepository
	extends MongooseSeedwork.MongoRepositoryBase<VideoViewing, PropType, Domain.Passport, Domain.Contexts.Video.VideoViewing.VideoViewing<PropType>>
	implements Domain.Contexts.Video.VideoViewing.VideoViewingRepository<PropType>
{
	/** A member's viewing of a video, or `undefined` when they have not started watching it. */
	async getByVideoAndMember(videoId: string, memberId: string): Promise<Domain.Contexts.Video.VideoViewing.VideoViewing<PropType> | undefined> {
		const doc = await this.model.findOne({ video: new MongooseSeedwork.ObjectId(videoId), member: new MongooseSeedwork.ObjectId(memberId) }).exec();
		return doc ? this.typeConverter.toDomain(doc, this.passport) : undefined;
	}

	/** Starts a member's viewing of a ready video. */
	getNewInstance(video: Domain.Contexts.Video.Video.VideoEntityReference, memberId: string, now: Date): Promise<Domain.Contexts.Video.VideoViewing.VideoViewing<PropType>> {
		const adapter = this.typeConverter.toAdapter(new this.model());
		return Promise.resolve(Domain.Contexts.Video.VideoViewing.VideoViewing.getNewInstance(adapter, video, memberId, now, this.passport));
	}
}
