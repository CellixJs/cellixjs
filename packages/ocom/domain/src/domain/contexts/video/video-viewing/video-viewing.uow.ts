import type { InitializedUnitOfWork, UnitOfWork } from '@cellix/domain-seedwork/unit-of-work';
import type { Passport } from '../../passport.ts';
import type { VideoViewing, VideoViewingProps } from './video-viewing.aggregate.ts';
import type { VideoViewingRepository } from './video-viewing.repository.ts';

export interface VideoViewingUnitOfWork
	extends UnitOfWork<Passport, VideoViewingProps, VideoViewing<VideoViewingProps>, VideoViewingRepository<VideoViewingProps>>,
		InitializedUnitOfWork<Passport, VideoViewingProps, VideoViewing<VideoViewingProps>, VideoViewingRepository<VideoViewingProps>> {}
