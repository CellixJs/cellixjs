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

	/** Caption files attached by community admins, one per language. */
	captionTracks: VideoCaptionTrack[];

	readonly createdAt: Date;
	readonly updatedAt: Date;
	readonly schemaVersion: string;
}

export interface VideoEntityReference extends Readonly<Omit<VideoProps, 'community' | 'setCommunityRef' | 'renditionHeights' | 'captionTracks'>> {
	get community(): CommunityEntityReference;
	readonly renditionHeights: readonly number[];
	readonly captionTracks: readonly Readonly<VideoCaptionTrack>[];
	/** Manifest locations of a ready video, after checking the caller may watch it. */
	requestPlayback(): VideoPlayback;
	/** Whether the caller may encode this video now. */
	canEncode(): boolean;
	/** Full output blob names for relative paths, after checking the caller may upload encoded output. */
	resolveOutputBlobNames(relativePaths: readonly string[]): string[];
}

/** Where the original upload is stored, and what the client declared it to be. */
export interface NewVideoSource {
	containerName: string;
	blobName: string;
	contentType: string;
	sizeBytes: number;
}

/** Where the encoded output will be written. */
export interface EncodingDestination {
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

/** A caption file attached to a video, stored as WebVTT. */
export interface VideoCaptionTrack {
	/** BCP 47 language tag. A video has at most one track per language. */
	language: string;
	/** Name shown in the player's captions menu. */
	label: string;
	kind: 'captions' | 'subtitles';
	containerName: string;
	blobName: string;
}

/** Describes a caption file to attach. */
export interface NewVideoCaption {
	language: string;
	label: string;
	kind: string;
}

/** What a viewer needs to stream a ready video. */
export interface VideoPlayback {
	containerName: string;
	dashManifestBlobName: string;
	hlsManifestBlobName: string;
	captionTracks: VideoCaptionTrack[];
}

/**
 * A video in a community's library.
 *
 * Lifecycle (ADR 0036): `AWAITING_UPLOAD` (created, client uploading the
 * original) → `UPLOADED` (upload confirmed, waiting for staff) → `ENCODING`
 * (a staff member is encoding it) → `READY` (playable) or `FAILED`. Members
 * who can manage site content upload and manage videos; any member of the
 * community can watch a ready video. Staff with `canEncodeVideos` encode
 * videos and record the results.
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
		video.props.captionTracks = [];
		video.isNew = false;
		return video;
	}

	/**
	 * Confirms the original was uploaded and moves the video to `UPLOADED`,
	 * where it waits for staff to encode it. Calling it again once uploaded is
	 * a no-op, so a client can safely retry.
	 *
	 * @throws {PermissionError} Without permission to manage videos.
	 * @throws {Error} When the video is past the upload stage.
	 */
	public markUploadCompleted(): void {
		this.ensureCan('canManageVideos', 'You do not have permission to complete this upload');
		if (this.props.status === VideoStatuses.Uploaded) {
			return;
		}
		this.ensureStatus([VideoStatuses.AwaitingUpload], 'complete the upload for');
		this.props.status = VideoStatuses.Uploaded;
	}

	/**
	 * Starts (or restarts) encoding and moves the video to `ENCODING`. Allowed
	 * for an uploaded video, a failed video (to retry), or a video already
	 * encoding (so another staff member can take over an abandoned encode).
	 * Clears any previous failure.
	 *
	 * @param destination - Container and prefix the encoded output is written to.
	 * @throws {PermissionError} Without permission to encode videos.
	 * @throws {Error} When the video is awaiting upload or already ready.
	 */
	public startEncoding(destination: EncodingDestination): void {
		this.ensureCan('canEncodeVideos', 'You do not have permission to encode videos');
		const containerName = new ValueObjects.ContainerName(destination.containerName).valueOf();
		const prefix = new ValueObjects.OutputPrefix(destination.prefix).valueOf();
		this.ensureStatus([VideoStatuses.Uploaded, VideoStatuses.Failed, VideoStatuses.Encoding], 'start encoding');
		this.props.outputContainerName = containerName;
		this.props.outputPrefix = prefix;
		this.props.failureCode = null;
		this.props.failureMessage = null;
		this.props.status = VideoStatuses.Encoding;
	}

	/**
	 * Whether the caller may encode this video now: they have permission to
	 * encode videos, and it is uploaded, failed, or already encoding.
	 */
	public canEncode(): boolean {
		return this.visa.determineIf((permissions) => permissions.canEncodeVideos) && ([VideoStatuses.Uploaded, VideoStatuses.Encoding, VideoStatuses.Failed] as VideoStatus[]).includes(this.props.status as VideoStatus);
	}

	/**
	 * Converts the relative paths of encoded output files into full blob names
	 * under this video's output prefix, so the caller can issue upload links
	 * for exactly those blobs.
	 *
	 * @param relativePaths - Paths relative to the output prefix, for example `video/720/1.m4s`.
	 * @returns Blob names in the output container, in the same order.
	 * @throws {PermissionError} Without permission to encode videos.
	 * @throws {Error} When the video is not encoding, a path is invalid, or too many paths are requested.
	 */
	public resolveOutputBlobNames(relativePaths: readonly string[]): string[] {
		this.ensureCan('canEncodeVideos', 'You do not have permission to encode videos');
		this.ensureStatus([VideoStatuses.Encoding], 'upload encoded output for');
		if (relativePaths.length > ValueObjects.MaxOutputPathsPerRequest) {
			throw new Error(`At most ${ValueObjects.MaxOutputPathsPerRequest} output files can be requested at once`);
		}
		const prefix = this.props.outputPrefix ?? '';
		return relativePaths.map((path) => {
			const relativePath = new ValueObjects.OutputRelativePath(path).valueOf();
			if (relativePath.startsWith(ValueObjects.CaptionsPath)) {
				throw new Error(`Encoded output cannot be written under ${ValueObjects.CaptionsPath}, which holds attached captions`);
			}
			return new ValueObjects.BlobName(`${prefix}${relativePath}`).valueOf();
		});
	}

	/**
	 * Records a successful encode and makes the video `READY`. Repeating it
	 * replaces the previous result, so a retried request is harmless.
	 *
	 * @throws {PermissionError} Without permission to encode videos.
	 * @throws {Error} When the video is not encoding or ready.
	 */
	public recordEncodingSucceeded(result: EncodingSuccess): void {
		this.ensureCan('canEncodeVideos', 'You do not have permission to record encoding results');
		this.ensureStatus([VideoStatuses.Encoding, VideoStatuses.Ready], 'record an encoding result for');
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
	 * @throws {PermissionError} Without permission to encode videos.
	 * @throws {Error} When the video is not encoding or failed.
	 */
	public recordEncodingFailed(failure: EncodingFailure): void {
		this.ensureCan('canEncodeVideos', 'You do not have permission to record encoding results');
		this.ensureStatus([VideoStatuses.Encoding, VideoStatuses.Failed], 'record an encoding failure for');
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
		return { containerName: outputContainerName, dashManifestBlobName, hlsManifestBlobName, captionTracks: this.captionTracks.map((track) => ({ ...track })) };
	}

	/**
	 * Attaches a caption file, replacing the track for the same language if
	 * there is one. The caller stores the WebVTT file at the returned blob,
	 * under `<videoId>/captions/` in the community's video container, where
	 * the playback token can read it. Allowed at any status, so captions can
	 * be added before or after encoding.
	 *
	 * @param caption - Language (BCP 47), label, and kind (`captions` or `subtitles`).
	 * @param containerName - The community's video container.
	 * @returns The track, including where to store the file.
	 * @throws {PermissionError} Without permission to manage videos.
	 * @throws {Error} When a value is invalid, or the video already has the most tracks allowed.
	 */
	public attachCaption(caption: NewVideoCaption, containerName: string): VideoCaptionTrack {
		this.ensureCan('canManageVideos', 'You do not have permission to manage captions');
		const language = new ValueObjects.CaptionLanguage(caption.language).valueOf();
		const track: VideoCaptionTrack = {
			language,
			label: new ValueObjects.CaptionLabel(caption.label).valueOf(),
			kind: new ValueObjects.CaptionKind(caption.kind).valueOf(),
			containerName: new ValueObjects.ContainerName(containerName).valueOf(),
			blobName: new ValueObjects.BlobName(`${this.props.id}/${ValueObjects.CaptionsPath}${language}.vtt`).valueOf(),
		};
		const others = this.props.captionTracks.filter((existing) => existing.language !== language);
		if (others.length >= ValueObjects.MaxCaptionTracks) {
			throw new Error(`A video can have at most ${ValueObjects.MaxCaptionTracks} caption tracks`);
		}
		this.props.captionTracks = [...others, track];
		return { ...track };
	}

	/**
	 * Removes the caption track for a language.
	 *
	 * @returns The removed track, so the caller can delete its file.
	 * @throws {PermissionError} Without permission to manage videos.
	 * @throws {Error} When the video has no captions in that language.
	 */
	public removeCaption(language: string): VideoCaptionTrack {
		this.ensureCan('canManageVideos', 'You do not have permission to manage captions');
		const removed = this.props.captionTracks.find((track) => track.language === language);
		if (!removed) {
			throw new Error(`Video ${this.props.id} has no captions in ${language}`);
		}
		this.props.captionTracks = this.props.captionTracks.filter((track) => track !== removed);
		return { ...removed };
	}

	private ensureCan(permission: 'canManageVideos' | 'canEncodeVideos', message: string): void {
		if (!this.visa.determineIf((permissions) => permissions[permission])) {
			throw new PermissionError(message);
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
		this.ensureCan('canManageVideos', 'You do not have permission to update this title');
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
	get captionTracks(): readonly Readonly<VideoCaptionTrack>[] {
		return this.props.captionTracks.map((track) => ({ ...track }));
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
