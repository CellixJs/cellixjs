import { useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminVideosListContainerCommunityVideosDocument } from '../generated.tsx';
import { VideosList } from './videos-list.tsx';
import { VideosUploadContainer } from './videos-upload.container.tsx';

/** How often to check on videos staff have not finished encoding. */
const PendingPollIntervalMs = 30_000;

export const VideosListContainer: React.FC = () => {
	const navigate = useNavigate();
	const [uploadOpen, setUploadOpen] = useState(false);
	const [hasPending, setHasPending] = useState(false);

	const { data, loading, error, refetch } = useQuery(AdminVideosListContainerCommunityVideosDocument, {
		fetchPolicy: 'cache-and-network',
		pollInterval: hasPending ? PendingPollIntervalMs : 0,
		onCompleted: (result) => setHasPending(result.communityVideos.some((video) => video.status === 'UPLOADED' || video.status === 'ENCODING')),
	});

	return (
		<>
			<ComponentQueryLoader
				loading={loading && !data}
				hasData={data?.communityVideos}
				hasDataComponent={
					<VideosList
						data={data?.communityVideos ?? []}
						loading={loading}
						onUpload={() => setUploadOpen(true)}
						onWatch={(videoId) => navigate(videoId)}
						onRefresh={() => void refetch()}
					/>
				}
				error={error}
			/>
			<VideosUploadContainer
				open={uploadOpen}
				onClose={() => setUploadOpen(false)}
				onUploaded={() => void refetch()}
			/>
		</>
	);
};
