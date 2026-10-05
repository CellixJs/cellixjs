import { VOArray, VOFloat, VOInteger, VOOptional, VOSet, VOString } from '@lucaspaganini/value-objects';

/** Lifecycle of a video, from creation to playable or failed. */
export const VideoStatuses = {
	AwaitingUpload: 'AWAITING_UPLOAD',
	Uploaded: 'UPLOADED',
	Encoding: 'ENCODING',
	Ready: 'READY',
	Failed: 'FAILED',
} as const;
export type VideoStatus = (typeof VideoStatuses)[keyof typeof VideoStatuses];

/** Video file types accepted for upload. */
export const VideoContentTypes = ['video/mp4', 'video/quicktime', 'video/webm'] as const;

/** Largest accepted upload: 2 GiB, sent as a single signed PUT. */
export const MaxVideoSizeBytes = 2 * 1024 * 1024 * 1024;

export class Title extends VOString({ trim: true, minLength: 1, maxLength: 200 }) {}
export class Status extends VOSet(Object.values(VideoStatuses)) {}
export class ContentType extends VOSet([...VideoContentTypes]) {}
export class SizeBytes extends VOInteger({ min: 1, max: MaxVideoSizeBytes }) {}

/** Azure Blob container name: 3-63 lowercase letters, digits, and single hyphens. */
export class ContainerName extends VOString({ minLength: 3, maxLength: 63, pattern: /^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){2,62}$/ }) {}
export class BlobName extends VOString({ minLength: 1, maxLength: 1024 }) {}
/**
 * Path of one encoded output file relative to the video's output prefix, for
 * example `video/720/1.m4s`. Slash-separated segments of letters, digits, `.`,
 * `_`, and `-`, with no empty, `.`, or `..` segments.
 */
export class OutputRelativePath extends VOString({ minLength: 1, maxLength: 512, pattern: /^(?!.*(?:^|\/)\.{1,2}(?:\/|$))[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*$/ }) {}

/** Most output files a single upload request may cover. */
export const MaxOutputPathsPerRequest = 1000;

/** Blob-name prefix for encoded output, for example `video-123/`. */
export class OutputPrefix extends VOString({ minLength: 1, maxLength: 1024, pattern: /\/$/ }) {}

export class DurationSeconds extends VOFloat({ min: 0, max: 24 * 60 * 60 }) {}
class RenditionHeight extends VOInteger({ min: 2, max: 4320 }) {}
export class RenditionHeights extends VOArray(RenditionHeight, { minLength: 1, maxLength: 10 }) {}

class FailureCodeBase extends VOString({ trim: true, minLength: 1, maxLength: 64 }) {}
export class FailureCode extends VOOptional(FailureCodeBase, [null]) {}
class FailureMessageBase extends VOString({ trim: true, minLength: 1, maxLength: 2000 }) {}
export class FailureMessage extends VOOptional(FailureMessageBase, [null]) {}
