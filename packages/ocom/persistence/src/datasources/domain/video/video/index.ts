import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../../index.ts';
import { getVideoUnitOfWork } from './video.uow.ts';

export const VideoPersistence = (models: ModelsContext, passport: Domain.Passport) => {
	const VideoModel = models.Video;
	return {
		VideoUnitOfWork: getVideoUnitOfWork(VideoModel, passport),
	};
};
