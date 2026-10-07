import { InProcEventBusInstance, NodeEventBusInstance } from '@cellix/event-bus-seedwork-node';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { VideoViewingModelType } from '@ocom/data-sources-mongoose-models/video-viewing';
import type { Domain } from '@ocom/domain';
import { VideoViewingConverter } from './video-viewing.domain-adapter.ts';
import { VideoViewingRepository } from './video-viewing.repository.ts';

export const getVideoViewingUnitOfWork = (videoViewingModel: VideoViewingModelType, passport: Domain.Passport): Domain.Contexts.Video.VideoViewing.VideoViewingUnitOfWork => {
	const unitOfWork = new MongooseSeedwork.MongoUnitOfWork(InProcEventBusInstance, NodeEventBusInstance, videoViewingModel, new VideoViewingConverter(), VideoViewingRepository);
	return MongooseSeedwork.getInitializedUnitOfWork(unitOfWork, passport);
};
