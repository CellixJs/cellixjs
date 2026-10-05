import { CloudUploadOutlined, ReloadOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { Button, Space, Table, Tag, Tooltip, Typography } from 'antd';
import type { AdminVideosListContainerVideoFieldsFragment, VideoStatus } from '../generated.tsx';

const { Title, Text } = Typography;

export const videoStatusDisplay: Record<VideoStatus, { label: string; color: string; description: string }> = {
	AWAITING_UPLOAD: { label: 'Upload incomplete', color: 'default', description: 'The upload did not finish. Upload the video again.' },
	UPLOADED: { label: 'Waiting to be encoded', color: 'blue', description: 'Uploaded. Staff will prepare it for streaming.' },
	ENCODING: { label: 'Encoding', color: 'processing', description: 'Staff are preparing it for streaming.' },
	READY: { label: 'Ready', color: 'green', description: 'Ready to watch.' },
	FAILED: { label: 'Encoding failed', color: 'red', description: 'The video could not be prepared for streaming.' },
};

/** `m:ss`, or `h:mm:ss` for an hour or more. */
export const formatDuration = (seconds: number | null | undefined): string => {
	if (seconds == null) {
		return '—';
	}
	const total = Math.round(seconds);
	const hours = Math.floor(total / 3600);
	const minutes = Math.floor((total % 3600) / 60);
	const secs = String(total % 60).padStart(2, '0');
	return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${secs}` : `${minutes}:${secs}`;
};

export const formatSize = (bytes: number): string => {
	if (bytes >= 1024 ** 3) {
		return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
	}
	return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
};

interface VideosListProps {
	data: AdminVideosListContainerVideoFieldsFragment[];
	loading?: boolean;
	onUpload: () => void;
	onWatch: (videoId: string) => void;
	onRefresh: () => void;
}

export const VideosList: React.FC<VideosListProps> = ({ data, loading, onUpload, onWatch, onRefresh }) => {
	const columns: TableColumnsType<AdminVideosListContainerVideoFieldsFragment> = [
		{ title: 'Title', dataIndex: 'title', key: 'title' },
		{
			title: 'Status',
			key: 'status',
			render: (_value: unknown, video) => {
				const display = videoStatusDisplay[video.status];
				const description = video.status === 'FAILED' && video.failureMessage ? `${display.description} ${video.failureMessage}` : display.description;
				return (
					<Tooltip title={description}>
						<Tag color={display.color}>{display.label}</Tag>
					</Tooltip>
				);
			},
		},
		{ title: 'Length', key: 'duration', render: (_value: unknown, video) => formatDuration(video.durationSeconds) },
		{
			title: 'Quality',
			key: 'quality',
			render: (_value: unknown, video) => (video.renditionHeights.length > 0 ? `Up to ${Math.max(...video.renditionHeights)}p` : '—'),
		},
		{ title: 'Size', key: 'size', render: (_value: unknown, video) => formatSize(Number(video.sourceSizeBytes)) },
		{ title: 'Uploaded', key: 'createdAt', render: (_value: unknown, video) => new Date(video.createdAt).toLocaleDateString() },
		{
			title: 'Action',
			key: 'action',
			render: (_value: unknown, video) =>
				video.status === 'READY' ? (
					<Button
						type="link"
						onClick={() => onWatch(String(video.id))}
					>
						Watch
					</Button>
				) : null,
		},
	];

	return (
		<Space
			orientation="vertical"
			size="large"
			style={{ width: '100%' }}
		>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<Title level={3}>Community Videos ({data.length})</Title>
				<Space>
					<Button
						icon={<ReloadOutlined />}
						onClick={onRefresh}
					>
						Refresh
					</Button>
					<Button
						type="primary"
						icon={<CloudUploadOutlined />}
						onClick={onUpload}
					>
						Upload Video
					</Button>
				</Space>
			</div>
			<Text type="secondary">Uploaded videos are prepared for streaming by staff before members can watch them.</Text>
			<Table
				dataSource={data}
				columns={columns}
				rowKey="id"
				loading={loading ?? false}
				locale={{ emptyText: 'No videos yet. Upload one to get started.' }}
				pagination={{ pageSize: 10, hideOnSinglePage: true }}
			/>
		</Space>
	);
};
