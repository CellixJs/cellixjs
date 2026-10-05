import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../index.ts';
import { VideoReadRepositoryImpl } from './video/index.ts';

export const VideoContext = (models: ModelsContext, passport: Domain.Passport) => ({
	Video: VideoReadRepositoryImpl(models, passport),
});
