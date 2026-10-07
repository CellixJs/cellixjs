import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../../index.ts';
import { getVideoViewingUnitOfWork } from './video-viewing.uow.ts';

export const VideoViewingPersistence = (models: ModelsContext, passport: Domain.Passport) => {
	return {
		VideoViewingUnitOfWork: getVideoViewingUnitOfWork(models.VideoViewing, passport),
	};
};
