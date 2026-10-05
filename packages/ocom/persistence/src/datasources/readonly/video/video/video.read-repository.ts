import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../../index.ts';
import { VideoConverter } from '../../../domain/video/video/video.domain-adapter.ts';
import type { FindOneOptions, FindOptions } from '../../mongo-data-source.ts';
import { type VideoDataSource, VideoDataSourceImpl } from './video.data.ts';

export interface VideoReadRepository {
	getById: (id: string, options?: FindOneOptions) => Promise<Domain.Contexts.Video.Video.VideoEntityReference | null>;
	getByCommunityId: (communityId: string, options?: FindOptions) => Promise<Domain.Contexts.Video.Video.VideoEntityReference[]>;
}

export class VideoReadRepositoryImpl implements VideoReadRepository {
	private readonly mongoDataSource: VideoDataSource;
	private readonly converter: VideoConverter;
	private readonly passport: Domain.Passport;

	/**
	 * @param models - The models context containing the Video model.
	 * @param passport - The passport used for permission checks on the returned videos.
	 */
	constructor(models: ModelsContext, passport: Domain.Passport) {
		this.mongoDataSource = new VideoDataSourceImpl(models.Video);
		this.converter = new VideoConverter();
		this.passport = passport;
	}

	/**
	 * Retrieves a video by id.
	 * @returns The video, or null if it does not exist.
	 */
	async getById(id: string, options?: FindOneOptions): Promise<Domain.Contexts.Video.Video.VideoEntityReference | null> {
		const result = await this.mongoDataSource.findById(id, options);
		if (!result) {
			return null;
		}
		return this.converter.toDomain(result, this.passport);
	}

	/**
	 * Retrieves a community's videos, newest first unless `options.sort` says otherwise.
	 */
	async getByCommunityId(communityId: string, options?: FindOptions): Promise<Domain.Contexts.Video.Video.VideoEntityReference[]> {
		const finalOptions: FindOptions = { sort: { createdAt: -1 }, ...options };
		const result = await this.mongoDataSource.find({ community: new MongooseSeedwork.ObjectId(communityId) }, finalOptions);
		return result.map((doc) => this.converter.toDomain(doc, this.passport));
	}
}

export const getVideoReadRepository = (models: ModelsContext, passport: Domain.Passport): VideoReadRepository => {
	return new VideoReadRepositoryImpl(models, passport);
};
