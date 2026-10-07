import { Progress, Table, Tag, Typography } from 'antd';
import type { AdminVideosDetailContainerViewingFieldsFragment } from '../generated.tsx';
import { coveragePercent } from './videos-watch-progress.tsx';

const { Title, Text } = Typography;

type VideosViewer = AdminVideosDetailContainerViewingFieldsFragment & {
	memberId: string;
	member?: { memberName?: string | null } | null;
};

interface VideosViewersProps {
	viewings: readonly VideosViewer[];
}

/** Members who have started watching a video, and how far each has got. */
export const VideosViewers: React.FC<VideosViewersProps> = ({ viewings }) => {
	return (
		<div>
			<Title level={4}>Viewers</Title>
			{viewings.length === 0 ? (
				<Text type="secondary">No one has started watching this video yet.</Text>
			) : (
				<Table
					size="small"
					rowKey="id"
					pagination={false}
					dataSource={[...viewings]}
					columns={[
						{ title: 'Member', key: 'member', render: (_, viewing) => viewing.member?.memberName ?? 'Unknown member' },
						{
							title: 'Watched',
							key: 'coverage',
							render: (_, viewing) => (
								<Progress
									percent={coveragePercent(viewing.coverage)}
									size="small"
									status={viewing.completedAt ? 'success' : 'normal'}
									style={{ minWidth: 120 }}
								/>
							),
						},
						{
							title: 'Status',
							key: 'status',
							render: (_, viewing) => (viewing.completedAt ? <Tag color="success">Completed</Tag> : <Tag>In progress</Tag>),
						},
						{ title: 'Last watched', key: 'updatedAt', render: (_, viewing) => new Date(viewing.updatedAt).toLocaleString() },
					]}
				/>
			)}
		</div>
	);
};
