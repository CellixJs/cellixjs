import { useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import { useParams } from 'react-router-dom';
import { AdminVideosDetailContainerPlaybackDocument, AdminVideosDetailContainerVideoDocument } from '../generated.tsx';
import { VideosDetail } from './videos-detail.tsx';

export const VideosDetailContainer: React.FC = () => {
	const { videoId } = useParams<{ videoId: string }>();
	const id = videoId ?? '';
	const video = useQuery(AdminVideosDetailContainerVideoDocument, { variables: { id }, skip: !videoId });
	const isReady = video.data?.videoById?.status === 'READY';
	// Playback links are only issued for ready videos, and expire, so always fetch fresh ones.
	const playback = useQuery(AdminVideosDetailContainerPlaybackDocument, { variables: { id }, skip: !isReady, fetchPolicy: 'network-only' });
	const found = video.data?.videoById;
	const links = playback.data?.videoPlayback;

	return (
		<ComponentQueryLoader
			loading={video.loading}
			hasData={found}
			noDataComponent={<div>Video not found.</div>}
			hasDataComponent={
				found ? (
					<VideosDetail
						video={found}
						{...(links ? { playback: { hlsManifestUrl: links.hlsManifestUrl, sasToken: links.sasToken } } : {})}
						{...(playback.error ? { playbackError: 'The video could not be loaded for playback. Refresh the page to try again.' } : {})}
					/>
				) : (
					<div />
				)
			}
			error={video.error}
		/>
	);
};
