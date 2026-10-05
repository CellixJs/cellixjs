import { VideoPlayer } from '@cellix/ui-video-player';
import { Alert, Descriptions, Space, Tag, Typography } from 'antd';
import type { AdminVideosDetailContainerVideoFieldsFragment } from '../generated.tsx';
import { formatDuration, videoStatusDisplay } from './videos-list.tsx';

const { Title } = Typography;

interface VideosDetailPlayback {
	hlsManifestUrl: string;
	sasToken: string;
}

interface VideosDetailProps {
	video: AdminVideosDetailContainerVideoFieldsFragment;
	playback?: VideosDetailPlayback;
	playbackError?: string;
}

export const VideosDetail: React.FC<VideosDetailProps> = ({ video, playback, playbackError }) => {
	const display = videoStatusDisplay[video.status];
	return (
		<Space
			orientation="vertical"
			size="large"
			style={{ width: '100%' }}
		>
			<Title level={3}>{video.title}</Title>
			{video.status === 'READY' && playback ? (
				<VideoPlayer
					// HLS plays in every browser, including Safari, which has no DASH support.
					src={playback.hlsManifestUrl}
					sasToken={playback.sasToken}
					title={video.title}
					style={{ maxWidth: 960, width: '100%', aspectRatio: '16 / 9', background: '#000' }}
				/>
			) : (
				<Alert
					type={video.status === 'FAILED' ? 'error' : 'info'}
					showIcon
					title={display.label}
					description={video.status === 'FAILED' && video.failureMessage ? `${display.description} ${video.failureMessage}` : display.description}
				/>
			)}
			{playbackError ? (
				<Alert
					type="error"
					showIcon
					title={playbackError}
				/>
			) : null}
			<Descriptions
				column={1}
				size="small"
			>
				<Descriptions.Item label="Status">
					<Tag color={display.color}>{display.label}</Tag>
				</Descriptions.Item>
				<Descriptions.Item label="Length">{formatDuration(video.durationSeconds)}</Descriptions.Item>
				<Descriptions.Item label="Quality">
					{video.renditionHeights.length > 0
						? [...video.renditionHeights]
								.sort((a, b) => b - a)
								.map((height) => `${height}p`)
								.join(', ')
						: '—'}
				</Descriptions.Item>
				<Descriptions.Item label="Uploaded">{new Date(video.createdAt).toLocaleString()}</Descriptions.Item>
			</Descriptions>
		</Space>
	);
};
