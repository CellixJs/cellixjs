import { PlusOutlined } from '@ant-design/icons';
import { VideoPlayer } from '@cellix/ui-video-player';
import { Alert, Button, Descriptions, List, Popconfirm, Space, Tag, Typography } from 'antd';
import type { AdminVideosDetailContainerVideoFieldsFragment, VideoCaptionKind } from '../generated.tsx';
import { formatDuration, videoStatusDisplay } from './videos-list.tsx';

const { Title, Text } = Typography;

interface VideosDetailPlayback {
	hlsManifestUrl: string;
	sasToken: string;
	captionTracks: readonly { language: string; label: string; kind: VideoCaptionKind; url: string }[];
}

interface VideosDetailProps {
	video: AdminVideosDetailContainerVideoFieldsFragment;
	playback?: VideosDetailPlayback;
	playbackError?: string;
	onAddCaptions: () => void;
	onRemoveCaption: (language: string) => void;
	/** Language whose captions are being removed. */
	removingLanguage?: string;
}

const captionKindLabel: Record<VideoCaptionKind, string> = { CAPTIONS: 'Captions', SUBTITLES: 'Subtitles' };

export const VideosDetail: React.FC<VideosDetailProps> = ({ video, playback, playbackError, onAddCaptions, onRemoveCaption, removingLanguage }) => {
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
					textTracks={playback.captionTracks.map((track) => ({ src: track.url, language: track.language, label: track.label, kind: track.kind === 'SUBTITLES' ? 'subtitles' : 'captions', mimeType: 'text/vtt' }))}
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
			<div>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
					<Title level={4}>Captions</Title>
					<Button
						icon={<PlusOutlined />}
						onClick={onAddCaptions}
					>
						Add Captions
					</Button>
				</div>
				{video.captionTracks.length === 0 ? (
					<Text type="secondary">No captions yet. Add a WebVTT or SubRip file so members who cannot hear the audio can follow along.</Text>
				) : (
					<List
						size="small"
						dataSource={[...video.captionTracks]}
						rowKey="language"
						renderItem={(track) => (
							<List.Item
								actions={[
									<Popconfirm
										key="remove"
										title={`Remove the ${track.label} captions?`}
										okText="Remove"
										okButtonProps={{ danger: true }}
										onConfirm={() => onRemoveCaption(track.language)}
									>
										<Button
											type="link"
											danger
											loading={removingLanguage === track.language}
										>
											Remove
										</Button>
									</Popconfirm>,
								]}
							>
								<Space>
									<Text>{track.label}</Text>
									<Tag>{captionKindLabel[track.kind]}</Tag>
									<Text type="secondary">{track.language}</Text>
								</Space>
							</List.Item>
						)}
					/>
				)}
			</div>
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
