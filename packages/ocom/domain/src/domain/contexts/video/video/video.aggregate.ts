import { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import { Community, type CommunityEntityReference, type CommunityProps } from '../../community/community/community.ts';
import type { Passport } from '../../passport.ts';
import type { VideoVisa } from '../video.visa.ts';
import * as ValueObjects from './video.value-objects.ts';
import { type VideoStatus, VideoStatuses } from './video.value-objects.ts';

export interface VideoProps extends DomainEntityProps {
	readonly community: CommunityProps;
	setCommunityRef(community: CommunityEntityReference): void;
	title: string;
	status: string;

	sourceContainerName: string;
	sourceBlobName: string;
	sourceContentType: string;
	sourceSizeBytes: number;

	outputContainerName: string | null;
	outputPrefix: string | null;
	dashManifestBlobName: string | null;
	hlsManifestBlobName: string | null;
	durationSeconds: number | null;
	renditionHeights: number[];

	failureCode: string | null;
	failureMessage: string | null;

	readonly createdAt: Date;
	readonly updatedAt: Date;
	readonly schemaVersion: string;
}

export interface VideoEntityReference extends Readonly<Omit<VideoProps, 'community' | 'setCommunityRef' | 'renditionHeights'>> {
	get community(): CommunityEntityReference;
	readonly renditionHeights: readonly number[];
}

/** Where the original upload is stored, and what the client declared it to be. */
export interface NewVideoSource {
	containerName: string;
	blobName: string;
	contentType: string;
	sizeBytes: number;
}

/** Where the encoded output will be written. */
export interface UploadDestination {
	containerName: string;
	prefix: string;
}

export interface EncodingSuccess {
	dashManifestBlobName: string;
	hlsManifestBlobName: string;
	durationSeconds: number;
	renditionHeights: number[];
}

export interface EncodingFailure {
	code: string;
	message: string;
}

/** What a viewer needs to stream a ready video. */
export interface VideoPlayback {
	containerName: string;
	dashManifestBlobName: string;
	hlsManifestBlobName: string;
}

/**
 * A video in a community's library.
 *
 * Lifecycle: `AWAITING_UPLOAD` (created, client uploading the original) →
 * `PROCESSING` (upload confirmed, encoding queued) → `READY` (playable) or
 * `FAILED`. Members who can manage site content upload and manage videos; any
 * member of the community can watch a ready video. Only the system records
 * encoding results.
 */
export class Video<props extends VideoProps> extends AggregateRoot<props, Passport> implements VideoEntityReference {
	private isNew: boolean = false;
	private readonly visa: VideoVisa;

	constructor(props: props, passport: Passport) {
		super(props, passport);
		this.visa = passport.video.forVideo(this);
	}

	public static getNewInstance<props extends VideoProps>(newProps: props, title: string, source: NewVideoSource, community: CommunityEntityReference, passport: Passport): Video<props> {
		const video = new Video(newProps, passport);
		video.isNew = true;
		video.community = community;
		if (!video.visa.determineIf((permissions) => permissions.canManageVideos)) {
			throw new PermissionError('You do not have permission to upload videos');
		}
		video.title = title;
		video.props.sourceContainerName = new ValueObjects.ContainerName(source.containerName).valueOf();
		video.props.sourceBlobName = new ValueObjects.BlobName(source.blobName).valueOf();
		video.props.sourceContentType = new ValueObjects.ContentType(source.contentType).valueOf();
		video.props.sourceSizeBytes = new ValueObjects.SizeBytes(source.sizeBytes).valueOf();
		video.props.status = VideoStatuses.AwaitingUpload;
		video.props.outputContainerName = null;
		video.props.outputPrefix = null;
		video.props.dashManifestBlobName = null;
		video.props.hlsManifestBlobName = null;
		video.props.durationSeconds = null;
		video.props.renditionHeights = [];
		video.props.failureCode = null;
		video.props.failureMessage = null;
		video.isNew = false;
		return video;
	}

	/**
	 * Confirms the original was uploaded and moves the video to `PROCESSING`.
	 * Calling it again with the same destination while processing is a no-op,
	 * so a client can safely retry.
	 *
	 * @throws {PermissionError} Without permission to manage videos.
	 * @throws {Error} When the video is not awaiting upload.
	 */
	public markUploadCompleted(destination: UploadDestination): void {
		this.ensureCanManage('You do not have permission to complete this upload');
		const containerName = new ValueObjects.ContainerName(destination.containerName).valueOf();
		const prefix = new ValueObjects.OutputPrefix(destination.prefix).valueOf();
		if (this.props.status === VideoStatuses.Processing && this.props.outputContainerName === containerName && this.props.outputPrefix === prefix) {
			return;
		}
		this.ensureStatus([VideoStatuses.AwaitingUpload], 'complete the upload for');
		this.props.outputContainerName = containerName;
		this.props.outputPrefix = prefix;
		this.props.status = VideoStatuses.Processing;
	}

	/**
	 * Records a successful encode and makes the video `READY`. Repeating it
	 * replaces the previous result, so redelivered results are harmless.
	 *
	 * @throws {PermissionError} Unless called with the system passport.
	 * @throws {Error} When the video is not processing or ready.
	 */
	public recordEncodingSucceeded(result: EncodingSuccess): void {
		this.ensureSystem();
		this.ensureStatus([VideoStatuses.Processing, VideoStatuses.Ready], 'record an encoding result for');
		this.props.dashManifestBlobName = new ValueObjects.BlobName(result.dashManifestBlobName).valueOf();
		this.props.hlsManifestBlobName = new ValueObjects.BlobName(result.hlsManifestBlobName).valueOf();
		this.props.durationSeconds = new ValueObjects.DurationSeconds(result.durationSeconds).valueOf();
		this.props.renditionHeights = new ValueObjects.RenditionHeights(result.renditionHeights).valueOf();
		this.props.failureCode = null;
		this.props.failureMessage = null;
		this.props.status = VideoStatuses.Ready;
	}

	/**
	 * Records a failed encode and marks the video `FAILED`. Repeating it
	 * replaces the previous failure.
	 *
	 * @throws {PermissionError} Unless called with the system passport.
	 * @throws {Error} When the video is not processing or failed.
	 */
	public recordEncodingFailed(failure: EncodingFailure): void {
		this.ensureSystem();
		this.ensureStatus([VideoStatuses.Processing, VideoStatuses.Failed], 'record an encoding failure for');
		this.props.failureCode = new ValueObjects.FailureCode(failure.code).valueOf();
		this.props.failureMessage = new ValueObjects.FailureMessage(failure.message).valueOf();
		this.props.status = VideoStatuses.Failed;
	}

	/**
	 * Returns where a ready video's manifests are, for issuing a playback token.
	 *
	 * @throws {PermissionError} Without permission to view videos.
	 * @throws {Error} When the video is not ready.
	 */
	public requestPlayback(): VideoPlayback {
		if (!this.visa.determineIf((permissions) => permissions.canViewVideos)) {
			throw new PermissionError('You do not have permission to watch this video');
		}
		const { outputContainerName, dashManifestBlobName, hlsManifestBlobName } = this.props;
		if (this.props.status !== VideoStatuses.Ready || !outputContainerName || !dashManifestBlobName || !hlsManifestBlobName) {
			throw new Error(`Video ${this.props.id} is not ready to play`);
		}
		return { containerName: outputContainerName, dashManifestBlobName, hlsManifestBlobName };
	}

	private ensureCanManage(message: string): void {
		if (!this.visa.determineIf((permissions) => permissions.canManageVideos)) {
			throw new PermissionError(message);
		}
	}

	private ensureSystem(): void {
		if (!this.visa.determineIf((permissions) => permissions.isSystemAccount)) {
			throw new PermissionError('Only the system can record encoding results');
		}
	}

	private ensureStatus(allowed: VideoStatus[], action: string): void {
		if (!allowed.includes(this.props.status as VideoStatus)) {
			throw new Error(`Cannot ${action} video ${this.props.id} while it is ${this.props.status}`);
		}
	}

	get community(): CommunityEntityReference {
		return new Community(this.props.community, this.passport);
	}

	private set community(community: CommunityEntityReference) {
		if (!this.isNew) {
			throw new PermissionError('Unauthorized');
		}
		this.props.setCommunityRef(community);
	}

	get title(): string {
		return this.props.title;
	}
	set title(title: string) {
		this.ensureCanManage('You do not have permission to update this title');
		this.props.title = new ValueObjects.Title(title).valueOf();
	}

	get status(): string {
		return new ValueObjects.Status(this.props.status).valueOf();
	}
	get sourceContainerName(): string {
		return this.props.sourceContainerName;
	}
	get sourceBlobName(): string {
		return this.props.sourceBlobName;
	}
	get sourceContentType(): string {
		return this.props.sourceContentType;
	}
	get sourceSizeBytes(): number {
		return this.props.sourceSizeBytes;
	}
	get outputContainerName(): string | null {
		return this.props.outputContainerName;
	}
	get outputPrefix(): string | null {
		return this.props.outputPrefix;
	}
	get dashManifestBlobName(): string | null {
		return this.props.dashManifestBlobName;
	}
	get hlsManifestBlobName(): string | null {
		return this.props.hlsManifestBlobName;
	}
	get durationSeconds(): number | null {
		return this.props.durationSeconds;
	}
	get renditionHeights(): readonly number[] {
		return this.props.renditionHeights;
	}
	get failureCode(): string | null {
		return this.props.failureCode;
	}
	get failureMessage(): string | null {
		return this.props.failureMessage;
	}
	get createdAt(): Date {
		return this.props.createdAt;
	}
	get updatedAt(): Date {
		return this.props.updatedAt;
	}
	get schemaVersion(): string {
		return this.props.schemaVersion;
	}
}
