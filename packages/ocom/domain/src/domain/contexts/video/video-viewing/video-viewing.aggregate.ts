import { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import type { Passport } from '../../passport.ts';
import type { VideoEntityReference } from '../video/video.aggregate.ts';
import { VideoStatuses } from '../video/video.value-objects.ts';
import type { VideoVisa } from '../video.visa.ts';
import { addBuckets, bucketBounds, includesBucket, mergeTimeRanges, playedBuckets, playedThrough, unwatchedTimeRanges, type VideoBucketRange, type VideoTimeRange } from './video-viewing.buckets.ts';
import * as ValueObjects from './video-viewing.value-objects.ts';

/** Validates a reported playhead position, in seconds. */
function playheadPosition(position: number): number {
	try {
		return new ValueObjects.PositionSeconds(position).valueOf();
	} catch {
		throw new Error(`The playhead position must be between 0 and ${ValueObjects.MaxPositionSeconds} seconds`);
	}
}

export interface VideoViewingProps extends DomainEntityProps {
	communityId: string;
	videoId: string;
	memberId: string;
	/** The video's length when the viewing started. Later changes to the video do not move the buckets. */
	durationSeconds: number;
	bucketSeconds: number;
	bucketCount: number;
	/** Played buckets as merged runs, for example `[{ start: 0, end: 11 }, { start: 118, end: 119 }]`. */
	watchedBuckets: VideoBucketRange[];
	watchedBucketCount: number;
	/** Seconds of video that can still be credited before more real time passes. */
	creditSeconds: number;
	lastReportAt: Date | null;
	/** Where the member's player was at its last report that included a position, in seconds. Used to resume playback, not to credit buckets. */
	lastPositionSeconds: number | null;
	/**
	 * How far the video was played from the start without a gap, in seconds: the
	 * furthest point a member may skip to on their first watch. Never more than
	 * half a bucket past the first unwatched bucket. `null` for viewings saved
	 * before this was tracked, until their next report.
	 */
	watchedThroughSeconds: number | null;
	/** When enough of the video had been played. Never cleared. */
	completedAt: Date | null;

	readonly createdAt: Date;
	readonly updatedAt: Date;
	readonly schemaVersion: string;
}

export interface VideoViewingEntityReference extends Readonly<Omit<VideoViewingProps, 'watchedBuckets'>> {
	readonly watchedBuckets: readonly Readonly<VideoBucketRange>[];
	/** Share of buckets played, from 0 to 1. */
	readonly coverage: number;
	/** Spans of the video, in seconds, that have not been played yet. */
	readonly unwatchedRanges: VideoTimeRange[];
	/** Whether the caller may see this viewing: it is their own, or they manage the community's videos. */
	canView(): boolean;
}

/**
 * How much of a video one member has watched (ADR 0037).
 *
 * The video's timeline is split into buckets of `BucketSeconds`. The member's
 * player reports the spans it actually played, and a bucket counts once at
 * least half of it was played, so skipping ahead leaves gaps. The viewing is
 * complete once `CompletionThreshold` of the buckets are played, in any order
 * and over any number of sessions.
 *
 * Reports cannot credit video faster than `MaxPlaybackRate` times real time:
 * each viewing holds playback credit that builds with real time, up to
 * `MaxCreditSeconds`, and each newly credited bucket spends its length. When
 * credit runs out the rest of a report is not credited, and the player's next
 * report sends it again.
 */
export class VideoViewing<props extends VideoViewingProps> extends AggregateRoot<props, Passport> implements VideoViewingEntityReference {
	private readonly visa: VideoVisa;

	constructor(props: props, passport: Passport) {
		super(props, passport);
		this.visa = passport.video.forVideoViewing(this);
	}

	/**
	 * Starts a member's viewing of a ready video.
	 *
	 * @param video - The video being watched. Must be ready and have a duration.
	 * @param memberId - The member watching it, who must be the caller.
	 * @param now - When the viewing starts.
	 * @throws {PermissionError} When the caller is not that member, or cannot watch the video.
	 * @throws {Error} When the video is not ready.
	 */
	public static getNewInstance<props extends VideoViewingProps>(newProps: props, video: VideoEntityReference, memberId: string, now: Date, passport: Passport): VideoViewing<props> {
		newProps.communityId = new ValueObjects.ReferenceId(video.community.id).valueOf();
		newProps.videoId = new ValueObjects.ReferenceId(video.id).valueOf();
		newProps.memberId = new ValueObjects.ReferenceId(memberId).valueOf();
		const viewing = new VideoViewing(newProps, passport);
		if (!viewing.visa.determineIf((permissions) => permissions.isOwnVideoViewing && permissions.canViewVideos)) {
			throw new PermissionError('You can only record your own viewing of a video you can watch');
		}
		const { durationSeconds } = video;
		if (video.status !== VideoStatuses.Ready || !durationSeconds || durationSeconds <= 0) {
			throw new Error(`Video ${video.id} is not ready to watch`);
		}
		viewing.props.durationSeconds = durationSeconds;
		viewing.props.bucketSeconds = ValueObjects.BucketSeconds;
		viewing.props.bucketCount = Math.max(1, Math.ceil(durationSeconds / ValueObjects.BucketSeconds));
		viewing.props.watchedBuckets = [];
		viewing.props.watchedBucketCount = 0;
		viewing.props.creditSeconds = ValueObjects.InitialCreditSeconds;
		viewing.props.lastReportAt = now;
		viewing.props.lastPositionSeconds = null;
		viewing.props.watchedThroughSeconds = 0;
		viewing.props.completedAt = null;
		return viewing;
	}

	/**
	 * Records spans of the video the member's player played, and where its
	 * playhead is. Buckets already played are ignored, so a player can safely
	 * send every span it has played so far, including spans from a report that
	 * failed. The position only says where to resume; it never credits buckets.
	 *
	 * @param ranges - Played spans in seconds. Spans past the end are cut at the end; spans under half a second are ignored.
	 * @param now - When the report arrived.
	 * @param position - The playhead's position in seconds, cut at the end. When omitted, the last position is kept.
	 * @throws {PermissionError} When this is not the caller's own viewing.
	 * @throws {Error} When there are too many ranges, or a range or the position is invalid.
	 */
	public recordProgress(ranges: readonly VideoTimeRange[], now: Date, position?: number): void {
		if (!this.visa.determineIf((permissions) => permissions.isOwnVideoViewing)) {
			throw new PermissionError('You can only record your own viewing');
		}
		if (ranges.length > ValueObjects.MaxRangesPerReport) {
			throw new Error(`A report can include at most ${ValueObjects.MaxRangesPerReport} played ranges`);
		}
		const { durationSeconds, bucketSeconds, bucketCount } = this.props;
		const lastPosition = position === undefined ? this.props.lastPositionSeconds : Math.min(playheadPosition(position), durationSeconds);
		const played = mergeTimeRanges(
			ranges
				.map((range) => {
					const start = new ValueObjects.PositionSeconds(range.start).valueOf();
					const end = new ValueObjects.PositionSeconds(range.end).valueOf();
					if (end <= start) {
						throw new Error('A played range must end after it starts');
					}
					return { start, end: Math.min(end, durationSeconds) };
				})
				.filter((range) => range.end - range.start >= ValueObjects.MinRangeSeconds),
		);

		// Viewings saved before this was tracked start from their first unwatched bucket.
		const watchedThrough = this.props.watchedThroughSeconds ?? this.firstUnwatchedSecond();

		const lastReportAt = this.props.lastReportAt ?? now;
		const elapsedSeconds = Math.max(0, (now.getTime() - lastReportAt.getTime()) / 1000);
		let credit = Math.min(ValueObjects.MaxCreditSeconds, this.props.creditSeconds + elapsedSeconds * ValueObjects.MaxPlaybackRate);

		const credited: number[] = [];
		for (const index of playedBuckets(played, bucketSeconds, durationSeconds, bucketCount, ValueObjects.BucketPlayedShare)) {
			if (includesBucket(this.props.watchedBuckets, index)) {
				continue;
			}
			const bounds = bucketBounds(index, bucketSeconds, durationSeconds);
			const length = bounds.end - bounds.start;
			if (credit < length) {
				break;
			}
			credit -= length;
			credited.push(index);
		}

		if (credited.length > 0) {
			this.props.watchedBuckets = addBuckets(this.props.watchedBuckets, credited);
			this.props.watchedBucketCount += credited.length;
		}
		this.props.creditSeconds = credit;
		this.props.lastReportAt = now;
		this.props.lastPositionSeconds = lastPosition;
		// Played time only moves this as far as the credit check allows, so reports cannot stretch it faster than real time.
		this.props.watchedThroughSeconds = Math.min(playedThrough(watchedThrough, played, ValueObjects.GapToleranceSeconds), this.firstUnwatchedSecond() + bucketSeconds * ValueObjects.BucketPlayedShare, durationSeconds);
		if (!this.props.completedAt && this.props.watchedBucketCount >= Math.ceil(bucketCount * ValueObjects.CompletionThreshold)) {
			this.props.completedAt = now;
		}
	}

	private firstUnwatchedSecond(): number {
		return this.unwatchedRanges[0]?.start ?? this.props.durationSeconds;
	}

	public canView(): boolean {
		return this.visa.determineIf((permissions) => permissions.isOwnVideoViewing || permissions.canManageVideos);
	}

	get coverage(): number {
		return this.props.watchedBucketCount / this.props.bucketCount;
	}
	get unwatchedRanges(): VideoTimeRange[] {
		return unwatchedTimeRanges(this.props.watchedBuckets, this.props.bucketSeconds, this.props.durationSeconds, this.props.bucketCount);
	}
	get communityId(): string {
		return this.props.communityId;
	}
	get videoId(): string {
		return this.props.videoId;
	}
	get memberId(): string {
		return this.props.memberId;
	}
	get durationSeconds(): number {
		return this.props.durationSeconds;
	}
	get bucketSeconds(): number {
		return this.props.bucketSeconds;
	}
	get bucketCount(): number {
		return this.props.bucketCount;
	}
	get watchedBuckets(): readonly Readonly<VideoBucketRange>[] {
		return this.props.watchedBuckets.map((range) => ({ ...range }));
	}
	get watchedBucketCount(): number {
		return this.props.watchedBucketCount;
	}
	get creditSeconds(): number {
		return this.props.creditSeconds;
	}
	get lastReportAt(): Date | null {
		return this.props.lastReportAt;
	}
	get lastPositionSeconds(): number | null {
		return this.props.lastPositionSeconds;
	}
	get watchedThroughSeconds(): number | null {
		return this.props.watchedThroughSeconds;
	}
	get completedAt(): Date | null {
		return this.props.completedAt;
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
