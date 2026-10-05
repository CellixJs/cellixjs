import type { InitializedUnitOfWork, UnitOfWork } from '@cellix/domain-seedwork/unit-of-work';
import type { Passport } from '../../passport.ts';
import type { Video, VideoProps } from './video.aggregate.ts';
import type { VideoRepository } from './video.repository.ts';

export interface VideoUnitOfWork extends UnitOfWork<Passport, VideoProps, Video<VideoProps>, VideoRepository<VideoProps>>, InitializedUnitOfWork<Passport, VideoProps, Video<VideoProps>, VideoRepository<VideoProps>> {}
