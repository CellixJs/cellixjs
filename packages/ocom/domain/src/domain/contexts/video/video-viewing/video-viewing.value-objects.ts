import { VOFloat, VOString } from '@lucaspaganini/value-objects';

/** Length of one bucket of a video's timeline. A viewing tracks which buckets were played. */
export const BucketSeconds = 5;

/** Share of buckets that must be played for a viewing to count as complete. */
export const CompletionThreshold = 0.98;

/** Share of a bucket that must be played for it to count. A quick scrub across a bucket does not. */
export const BucketPlayedShare = 0.5;

/** Fastest playback that is credited: twice real time. */
export const MaxPlaybackRate = 2;

/**
 * Most unspent playback credit a viewing can hold, in seconds of video. Credit
 * builds at `MaxPlaybackRate` seconds per second of real time, so leaving a
 * video idle cannot bank more than this.
 */
export const MaxCreditSeconds = 120;

/** Credit a new viewing starts with, so its first report is not rejected. */
export const InitialCreditSeconds = 30;

/** Most played ranges accepted in one report. */
export const MaxRangesPerReport = 200;

/** Ranges shorter than this are ignored as noise from seeking. */
export const MinRangeSeconds = 0.5;

/** A MongoDB id, as a string. */
export class ReferenceId extends VOString({ minLength: 1, maxLength: 64 }) {}

/** A position in a video, in seconds. */
export class PositionSeconds extends VOFloat({ min: 0, max: 24 * 60 * 60 }) {}
