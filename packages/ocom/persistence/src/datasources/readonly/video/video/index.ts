import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../../index.ts';
import { getVideoReadRepository } from './video.read-repository.ts';

export type { VideoReadRepository } from './video.read-repository.ts';

export const VideoReadRepositoryImpl = (models: ModelsContext, passport: Domain.Passport) => {
	return {
		VideoReadRepo: getVideoReadRepository(models, passport),
	};
};
