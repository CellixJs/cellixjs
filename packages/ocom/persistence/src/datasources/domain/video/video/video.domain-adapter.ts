import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { Community } from '@ocom/data-sources-mongoose-models/community';
import type { Video } from '@ocom/data-sources-mongoose-models/video';
import { Domain } from '@ocom/domain';
import { CommunityDomainAdapter } from '../../community/community/community.domain-adapter.ts';

export class VideoConverter extends MongooseSeedwork.MongoTypeConverter<Video, VideoDomainAdapter, Domain.Passport, Domain.Contexts.Video.Video.Video<VideoDomainAdapter>> {
	constructor() {
		super(VideoDomainAdapter, Domain.Contexts.Video.Video.Video);
	}
}

export class VideoDomainAdapter extends MongooseSeedwork.MongooseDomainAdapter<Video> implements Domain.Contexts.Video.Video.VideoProps {
	/**
	 * The video's community. When only the id is loaded (a new video, or a
	 * document read without populating `community`), returns a reference with
	 * just the id, which is all permission checks need.
	 */
	get community(): Domain.Contexts.Community.Community.CommunityProps {
		if (!this.doc.community) {
			throw new Error('community is not populated');
		}
		if (this.doc.community instanceof MongooseSeedwork.ObjectId) {
			return { id: this.doc.community.toString() } as Domain.Contexts.Community.Community.CommunityProps;
		}
		return new CommunityDomainAdapter(this.doc.community as Community);
	}

	setCommunityRef(community: Domain.Contexts.Community.Community.CommunityEntityReference) {
		if (!community?.id) {
			throw new Error('community reference is missing id');
		}
		this.doc.set('community', new MongooseSeedwork.ObjectId(community.id));
	}

	get title() {
		return this.doc.title;
	}
	set title(title: string) {
		this.doc.title = title;
	}

	get status() {
		return this.doc.status;
	}
	set status(status: string) {
		this.doc.status = status;
	}

	get sourceContainerName() {
		return this.doc.sourceContainerName;
	}
	set sourceContainerName(value: string) {
		this.doc.sourceContainerName = value;
	}

	get sourceBlobName() {
		return this.doc.sourceBlobName;
	}
	set sourceBlobName(value: string) {
		this.doc.sourceBlobName = value;
	}

	get sourceContentType() {
		return this.doc.sourceContentType;
	}
	set sourceContentType(value: string) {
		this.doc.sourceContentType = value;
	}

	get sourceSizeBytes() {
		return this.doc.sourceSizeBytes;
	}
	set sourceSizeBytes(value: number) {
		this.doc.sourceSizeBytes = value;
	}

	get outputContainerName() {
		return this.doc.outputContainerName ?? null;
	}
	set outputContainerName(value: string | null) {
		this.doc.outputContainerName = value;
	}

	get outputPrefix() {
		return this.doc.outputPrefix ?? null;
	}
	set outputPrefix(value: string | null) {
		this.doc.outputPrefix = value;
	}

	get dashManifestBlobName() {
		return this.doc.dashManifestBlobName ?? null;
	}
	set dashManifestBlobName(value: string | null) {
		this.doc.dashManifestBlobName = value;
	}

	get hlsManifestBlobName() {
		return this.doc.hlsManifestBlobName ?? null;
	}
	set hlsManifestBlobName(value: string | null) {
		this.doc.hlsManifestBlobName = value;
	}

	get durationSeconds() {
		return this.doc.durationSeconds ?? null;
	}
	set durationSeconds(value: number | null) {
		this.doc.durationSeconds = value;
	}

	get renditionHeights(): number[] {
		return [...(this.doc.renditionHeights ?? [])];
	}
	set renditionHeights(value: number[]) {
		this.doc.set('renditionHeights', [...value]);
	}

	get failureCode() {
		return this.doc.failureCode ?? null;
	}
	set failureCode(value: string | null) {
		this.doc.failureCode = value;
	}

	get failureMessage() {
		return this.doc.failureMessage ?? null;
	}
	set failureMessage(value: string | null) {
		this.doc.failureMessage = value;
	}

	get captionTracks(): Domain.Contexts.Video.Video.VideoCaptionTrack[] {
		return (this.doc.captionTracks ?? []).map(({ language, label, kind, containerName, blobName }) => ({ language, label, kind, containerName, blobName }));
	}
	set captionTracks(value: Domain.Contexts.Video.Video.VideoCaptionTrack[]) {
		this.doc.set(
			'captionTracks',
			value.map(({ language, label, kind, containerName, blobName }) => ({ language, label, kind, containerName, blobName })),
		);
	}
}
