import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { VideoViewing } from '@ocom/data-sources-mongoose-models/video-viewing';
import { Domain } from '@ocom/domain';

export class VideoViewingConverter extends MongooseSeedwork.MongoTypeConverter<VideoViewing, VideoViewingDomainAdapter, Domain.Passport, Domain.Contexts.Video.VideoViewing.VideoViewing<VideoViewingDomainAdapter>> {
	constructor() {
		super(VideoViewingDomainAdapter, Domain.Contexts.Video.VideoViewing.VideoViewing);
	}
}

/** Maps a stored video viewing to the domain. References are stored as ObjectIds and exposed as id strings. */
export class VideoViewingDomainAdapter extends MongooseSeedwork.MongooseDomainAdapter<VideoViewing> implements Domain.Contexts.Video.VideoViewing.VideoViewingProps {
	get communityId() {
		return this.doc.community?.toString() ?? '';
	}
	set communityId(id: string) {
		this.doc.set('community', new MongooseSeedwork.ObjectId(id));
	}

	get videoId() {
		return this.doc.video?.toString() ?? '';
	}
	set videoId(id: string) {
		this.doc.set('video', new MongooseSeedwork.ObjectId(id));
	}

	get memberId() {
		return this.doc.member?.toString() ?? '';
	}
	set memberId(id: string) {
		this.doc.set('member', new MongooseSeedwork.ObjectId(id));
	}

	get durationSeconds() {
		return this.doc.durationSeconds;
	}
	set durationSeconds(value: number) {
		this.doc.durationSeconds = value;
	}

	get bucketSeconds() {
		return this.doc.bucketSeconds;
	}
	set bucketSeconds(value: number) {
		this.doc.bucketSeconds = value;
	}

	get bucketCount() {
		return this.doc.bucketCount;
	}
	set bucketCount(value: number) {
		this.doc.bucketCount = value;
	}

	get watchedBuckets(): Domain.Contexts.Video.VideoViewing.VideoBucketRange[] {
		return (this.doc.watchedBuckets ?? []).map(({ start, end }) => ({ start, end }));
	}
	set watchedBuckets(value: Domain.Contexts.Video.VideoViewing.VideoBucketRange[]) {
		this.doc.set(
			'watchedBuckets',
			value.map(({ start, end }) => ({ start, end })),
		);
	}

	get watchedBucketCount() {
		return this.doc.watchedBucketCount ?? 0;
	}
	set watchedBucketCount(value: number) {
		this.doc.watchedBucketCount = value;
	}

	get creditSeconds() {
		return this.doc.creditSeconds ?? 0;
	}
	set creditSeconds(value: number) {
		this.doc.creditSeconds = value;
	}

	get lastReportAt() {
		return this.doc.lastReportAt ?? null;
	}
	set lastReportAt(value: Date | null) {
		this.doc.lastReportAt = value;
	}

	get completedAt() {
		return this.doc.completedAt ?? null;
	}
	set completedAt(value: Date | null) {
		this.doc.completedAt = value;
	}
}
