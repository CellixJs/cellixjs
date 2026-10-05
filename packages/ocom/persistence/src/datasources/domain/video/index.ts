import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../index.ts';
import { VideoPersistence } from './video/index.ts';

export const VideoContextPersistence = (models: ModelsContext, passport: Domain.Passport) => ({
	Video: VideoPersistence(models, passport),
});
