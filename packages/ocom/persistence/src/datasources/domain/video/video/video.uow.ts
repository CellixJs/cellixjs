import { InProcEventBusInstance, NodeEventBusInstance } from '@cellix/event-bus-seedwork-node';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { VideoModelType } from '@ocom/data-sources-mongoose-models/video';
import type { Domain } from '@ocom/domain';
import { VideoConverter } from './video.domain-adapter.ts';
import { VideoRepository } from './video.repository.ts';

export const getVideoUnitOfWork = (videoModel: VideoModelType, passport: Domain.Passport): Domain.Contexts.Video.Video.VideoUnitOfWork => {
	const unitOfWork = new MongooseSeedwork.MongoUnitOfWork(InProcEventBusInstance, NodeEventBusInstance, videoModel, new VideoConverter(), VideoRepository);
	return MongooseSeedwork.getInitializedUnitOfWork(unitOfWork, passport);
};
