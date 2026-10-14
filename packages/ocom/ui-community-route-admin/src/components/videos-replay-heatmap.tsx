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
	onSeek: (seconds: number) => void;
}

/**
 * One row of the heatmap: a block per part of the video, shaded by how often
 * it was played again. Blocks with a count can be clicked to go there.
 */
const Band: React.FC<BandProps> = ({ counts, bucketCount, bucketSeconds, most, color, label, onSeek }) => (
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
						title={`${formatDuration(start)} — played again ${count} ${count === 1 ? 'time' : 'times'}`}
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
 * How often members played each part of the video again. The first row is
 * rewinds, made before they finished it; the second is return visits, made
 * after. Darker means more often.
 */
export const VideosReplayHeatmap: React.FC<VideosReplayHeatmapProps> = ({ heatmap, onSeek }) => {
	const { bucketSeconds, bucketCount, firstWatch, postCompletion, viewingCount } = heatmap;
	const most = Math.max(1, ...firstWatch, ...postCompletion);
	const nothingYet = most === 1 && ![...firstWatch, ...postCompletion].some((count) => count > 0);
	return (
		<div style={{ maxWidth: 960, width: '100%' }}>
			<Title level={5}>Replays</Title>
			{nothingYet ? (
				<Text type="secondary">Nobody has gone back over a part of this video yet.</Text>
			) : (
				<>
					<Text type="secondary">
						Across {viewingCount} {viewingCount === 1 ? 'viewing' : 'viewings'}. Darker parts were played again more often.
					</Text>
					<div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
						<div>
							<Text style={{ fontSize: 12 }}>Rewound before finishing</Text>
							<Band
								counts={firstWatch}
								bucketCount={bucketCount}
								bucketSeconds={bucketSeconds}
								most={most}
								color={FirstWatchColor}
								label="Rewound before finishing"
								onSeek={onSeek}
							/>
						</div>
						<div>
							<Text style={{ fontSize: 12 }}>Returned to after finishing</Text>
							<Band
								counts={postCompletion}
								bucketCount={bucketCount}
								bucketSeconds={bucketSeconds}
								most={most}
								color={PostCompletionColor}
								label="Returned to after finishing"
								onSeek={onSeek}
							/>
						</div>
					</div>
				</>
			)}
		</div>
	);
};
