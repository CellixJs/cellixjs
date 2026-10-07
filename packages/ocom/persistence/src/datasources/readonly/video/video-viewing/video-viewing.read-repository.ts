import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../../index.ts';
import { VideoViewingConverter } from '../../../domain/video/video-viewing/video-viewing.domain-adapter.ts';
import type { FindOptions } from '../../mongo-data-source.ts';
import { type VideoViewingDataSource, VideoViewingDataSourceImpl } from './video-viewing.data.ts';

export interface VideoViewingReadRepository {
	getByVideoAndMember: (videoId: string, memberId: string) => Promise<Domain.Contexts.Video.VideoViewing.VideoViewingEntityReference | null>;
	getByVideoId: (videoId: string, options?: FindOptions) => Promise<Domain.Contexts.Video.VideoViewing.VideoViewingEntityReference[]>;
}

export class VideoViewingReadRepositoryImpl implements VideoViewingReadRepository {
	private readonly mongoDataSource: VideoViewingDataSource;
	private readonly converter: VideoViewingConverter;
	private readonly passport: Domain.Passport;

	/**
	 * @param models - The models context containing the VideoViewing model.
	 * @param passport - The passport used for permission checks on the returned viewings.
	 */
	constructor(models: ModelsContext, passport: Domain.Passport) {
		this.mongoDataSource = new VideoViewingDataSourceImpl(models.VideoViewing);
		this.converter = new VideoViewingConverter();
		this.passport = passport;
	}

	/**
	 * Retrieves a member's viewing of a video.
	 * @returns The viewing, or null if the member has not started watching the video.
	 */
	async getByVideoAndMember(videoId: string, memberId: string): Promise<Domain.Contexts.Video.VideoViewing.VideoViewingEntityReference | null> {
		const result = await this.mongoDataSource.findOne({ video: new MongooseSeedwork.ObjectId(videoId), member: new MongooseSeedwork.ObjectId(memberId) });
		return result ? this.converter.toDomain(result, this.passport) : null;
	}

	/**
	 * Retrieves every member's viewing of a video, most recently updated first
	 * unless `options.sort` says otherwise.
	 */
	async getByVideoId(videoId: string, options?: FindOptions): Promise<Domain.Contexts.Video.VideoViewing.VideoViewingEntityReference[]> {
		const finalOptions: FindOptions = { sort: { updatedAt: -1 }, ...options };
		const result = await this.mongoDataSource.find({ video: new MongooseSeedwork.ObjectId(videoId) }, finalOptions);
		return result.map((doc) => this.converter.toDomain(doc, this.passport));
	}
}

export const getVideoViewingReadRepository = (models: ModelsContext, passport: Domain.Passport): VideoViewingReadRepository => {
	return new VideoViewingReadRepositoryImpl(models, passport);
};
