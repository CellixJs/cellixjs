import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../../index.ts';
import { getVideoViewingReadRepository } from './video-viewing.read-repository.ts';

export type { VideoViewingReadRepository } from './video-viewing.read-repository.ts';

export const VideoViewingReadRepositoryImpl = (models: ModelsContext, passport: Domain.Passport) => {
	return {
		VideoViewingReadRepo: getVideoViewingReadRepository(models, passport),
	};
};
