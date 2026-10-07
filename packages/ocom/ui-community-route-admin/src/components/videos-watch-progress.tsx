import { Button, Space, Tag, Typography } from 'antd';
import type { AdminVideosDetailContainerViewingFieldsFragment } from '../generated.tsx';
import { formatDuration } from './videos-list.tsx';

const { Title, Text } = Typography;

interface VideosWatchProgressProps {
	/** The signed-in member's viewing, or null before they start watching. */
	viewing: AdminVideosDetailContainerViewingFieldsFragment | null | undefined;
	/** Moves the player to a position, to watch a part that was skipped. */
	onSeek: (seconds: number) => void;
}

/** Whole percent watched, never rounded up to 100 before everything is watched. */
export const coveragePercent = (coverage: number): number => Math.floor(coverage * 100);

/**
 * A bar across the video's length: watched parts in green, unwatched parts
 * in grey.
 */
const WatchTimeline: React.FC<{ viewing: AdminVideosDetailContainerViewingFieldsFragment }> = ({ viewing }) => {
	const { durationSeconds, unwatched } = viewing;
	return (
		<div
			role="img"
			aria-label={`Watched ${coveragePercent(viewing.coverage)}% of the video, with ${unwatched.length} unwatched ${unwatched.length === 1 ? 'part' : 'parts'}`}
			style={{ position: 'relative', height: 10, borderRadius: 5, overflow: 'hidden', background: '#52c41a', maxWidth: 960 }}
		>
			{unwatched.map((range) => (
				<div
					key={range.start}
					data-testid="unwatched-part"
					style={{
						position: 'absolute',
						top: 0,
						bottom: 0,
						left: `${(range.start / durationSeconds) * 100}%`,
						width: `${((range.end - range.start) / durationSeconds) * 100}%`,
						background: '#d9d9d9',
					}}
				/>
			))}
		</div>
	);
};

/**
 * The signed-in member's progress through a video. Parts count only once they
 * have been played, so skipping ahead leaves gaps, which the member can jump
 * to and watch.
 */
export const VideosWatchProgress: React.FC<VideosWatchProgressProps> = ({ viewing, onSeek }) => {
	return (
		<div>
			<Title level={4}>Your Progress</Title>
			{viewing ? (
				<Space
					orientation="vertical"
					style={{ width: '100%' }}
				>
					<Space wrap>
						{viewing.completedAt ? <Tag color="success">Watched {new Date(viewing.completedAt).toLocaleDateString()}</Tag> : <Tag color="processing">In progress</Tag>}
						<Text>{coveragePercent(viewing.coverage)}% watched</Text>
					</Space>
					<WatchTimeline viewing={viewing} />
					{!viewing.completedAt && viewing.unwatched.length > 0 ? (
						<Space wrap>
							<Text type="secondary">Not watched yet:</Text>
							{viewing.unwatched.map((range) => (
								<Button
									key={range.start}
									size="small"
									onClick={() => onSeek(range.start)}
								>
									{formatDuration(range.start)} – {formatDuration(range.end)}
								</Button>
							))}
						</Space>
					) : null}
				</Space>
			) : (
				<Text type="secondary">You haven't started watching. Each part counts once you've played it, so skipping ahead leaves gaps to come back to.</Text>
			)}
		</div>
	);
};
