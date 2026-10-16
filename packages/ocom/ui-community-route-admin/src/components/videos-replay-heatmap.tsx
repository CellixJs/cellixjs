import { Typography } from 'antd';
import type { AdminVideosDetailContainerViewingsQuery } from '../generated.tsx';
import { formatDuration } from './videos-list.tsx';

const { Title, Text } = Typography;

export type ReplayHeatmap = NonNullable<NonNullable<AdminVideosDetailContainerViewingsQuery['videoById']>['replayHeatmap']>;

interface VideosReplayHeatmapProps {
	heatmap: ReplayHeatmap;
	/** Moves the player to a part, to see what members went back to. */
	onSeek: (seconds: number) => void;
}

/**
 * Shaka's control bar is 98% of the player's width and its seek bar adds 6px
 * either side, so a strip inset by this much sits under the same part of the
 * video the scrubber does.
 */
const ScrubberInset = 'calc(1% + 6px)';

/** Every play of a part: first views plus replays. */
const WatchedColor = '#52c41a';
/** Rewinds, which members made before they finished the video. */
const FirstWatchColor = '#fa8c16';
/** Return visits, which members made after they finished it. */
const PostCompletionColor = '#1677ff';

interface BandProps {
	counts: readonly number[];
	bucketCount: number;
	bucketSeconds: number;
	most: number;
	color: string;
	label: string;
	/** Completes "<time> — <verb> <count> times" in each block's tooltip. */
	verb: string;
	onSeek: (seconds: number) => void;
}

/**
 * One row of the heatmap: a block per part of the video, shaded by its count. Blocks with a count can be clicked to go there.
 */
const Band: React.FC<BandProps> = ({ counts, bucketCount, bucketSeconds, most, color, label, verb, onSeek }) => (
	<ul
		aria-label={label}
		style={{ display: 'flex', gap: 1, height: 14, margin: `0 ${ScrubberInset}`, padding: 0, listStyle: 'none' }}
	>
		{Array.from({ length: bucketCount }, (_, index) => {
			const count = counts[index] ?? 0;
			const start = index * bucketSeconds;
			return (
				<li
					key={start}
					style={{ flex: 1, minWidth: 0, display: 'flex' }}
				>
					<button
						type="button"
						data-testid="replay-part"
						disabled={count === 0}
						onClick={() => onSeek(start)}
						title={`${formatDuration(start)} — ${verb} ${count} ${count === 1 ? 'time' : 'times'}`}
						aria-label={`${label} at ${formatDuration(start)}: ${count}`}
						style={{
							flex: 1,
							minWidth: 0,
							padding: 0,
							border: 'none',
							borderRadius: 1,
							background: color,
							// Zero stays visible as a faint track so the row still reads as a timeline.
							opacity: count === 0 ? 0.12 : 0.25 + 0.75 * (count / most),
							cursor: count === 0 ? 'default' : 'pointer',
						}}
					/>
				</li>
			);
		})}
	</ul>
);

/**
 * How often members watched each part of the video, across everyone. The first
 * row is every play: each member's first view plus their replays. Below it,
 * replays are split into rewinds, made before members finished the video, and
 * return visits, made after. Darker means more often.
 */
export const VideosReplayHeatmap: React.FC<VideosReplayHeatmapProps> = ({ heatmap, onSeek }) => {
	const { bucketSeconds, bucketCount, viewers, firstWatch, postCompletion, viewingCount } = heatmap;
	const watched = Array.from({ length: bucketCount }, (_, index) => (viewers[index] ?? 0) + (firstWatch[index] ?? 0) + (postCompletion[index] ?? 0));
	const mostWatched = Math.max(1, ...watched);
	const mostReplayed = Math.max(1, ...firstWatch, ...postCompletion);
	const noReplays = ![...firstWatch, ...postCompletion].some((count) => count > 0);
	const band = { bucketCount, bucketSeconds, onSeek };
	return (
		<div style={{ maxWidth: 960, width: '100%' }}>
			<Title level={5}>Views and replays</Title>
			<Text type="secondary">
				Across {viewingCount} {viewingCount === 1 ? 'viewing' : 'viewings'}, as reported by members' players. Darker parts were watched more often.
			</Text>
			<div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
				<div>
					<Text style={{ fontSize: 12 }}>Times watched</Text>
					<Band
						{...band}
						counts={watched}
						most={mostWatched}
						color={WatchedColor}
						label="Times watched"
						verb="watched"
					/>
				</div>
				{noReplays ? (
					<Text type="secondary">Nobody has gone back over a part of this video yet.</Text>
				) : (
					<>
						<div>
							<Text style={{ fontSize: 12 }}>Rewound before finishing</Text>
							<Band
								{...band}
								counts={firstWatch}
								most={mostReplayed}
								color={FirstWatchColor}
								label="Rewound before finishing"
								verb="played again"
							/>
						</div>
						<div>
							<Text style={{ fontSize: 12 }}>Returned to after finishing</Text>
							<Band
								{...band}
								counts={postCompletion}
								most={mostReplayed}
								color={PostCompletionColor}
								label="Returned to after finishing"
								verb="played again"
							/>
						</div>
					</>
				)}
			</div>
		</div>
	);
};
