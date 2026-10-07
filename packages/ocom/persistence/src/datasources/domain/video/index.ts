import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../index.ts';
import { VideoPersistence } from './video/index.ts';
import { VideoViewingPersistence } from './video-viewing/index.ts';

export const VideoContextPersistence = (models: ModelsContext, passport: Domain.Passport) => ({
	Video: VideoPersistence(models, passport),
	VideoViewing: VideoViewingPersistence(models, passport),
});
