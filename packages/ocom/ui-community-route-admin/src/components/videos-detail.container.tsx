import { useMutation, useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import { App } from 'antd';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { AdminVideosDetailContainerPlaybackDocument, AdminVideosDetailContainerRemoveCaptionDocument, AdminVideosDetailContainerVideoDocument } from '../generated.tsx';
import { VideosCaptionUploadContainer } from './videos-caption-upload.container.tsx';
import { VideosDetail } from './videos-detail.tsx';

export const VideosDetailContainer: React.FC = () => {
	const { videoId } = useParams<{ videoId: string }>();
	const id = videoId ?? '';
	const { message } = App.useApp();
	const [captionsOpen, setCaptionsOpen] = useState(false);
	const [removingLanguage, setRemovingLanguage] = useState<string>();
	const video = useQuery(AdminVideosDetailContainerVideoDocument, { variables: { id }, skip: !videoId });
	const isReady = video.data?.videoById?.status === 'READY';
	// Playback links are only issued for ready videos, and expire, so always fetch fresh ones.
	const playback = useQuery(AdminVideosDetailContainerPlaybackDocument, { variables: { id }, skip: !isReady, fetchPolicy: 'network-only' });
	const [removeCaption] = useMutation(AdminVideosDetailContainerRemoveCaptionDocument);
	const found = video.data?.videoById;
	const links = playback.data?.videoPlayback;

	// Caption changes alter the player's text tracks, which come with the playback links.
	const refreshPlayback = () => {
		if (isReady) {
			void playback.refetch();
		}
	};

	const handleRemoveCaption = async (language: string) => {
		setRemovingLanguage(language);
		try {
			const result = await removeCaption({ variables: { input: { id, language } } });
			const status = result.data?.videoRemoveCaption.status;
			if (!status?.success) {
				throw new Error(status?.errorMessage ?? 'The captions could not be removed.');
			}
			message.success('Captions removed.');
			refreshPlayback();
		} catch (caught) {
			message.error((caught as Error).message);
		} finally {
			setRemovingLanguage(undefined);
		}
	};

	return (
		<>
			<ComponentQueryLoader
				loading={video.loading}
				hasData={found}
				noDataComponent={<div>Video not found.</div>}
				hasDataComponent={
					found ? (
						<VideosDetail
							video={found}
							{...(links ? { playback: { hlsManifestUrl: links.hlsManifestUrl, sasToken: links.sasToken, captionTracks: links.captionTracks } } : {})}
							{...(playback.error ? { playbackError: 'The video could not be loaded for playback. Refresh the page to try again.' } : {})}
							onAddCaptions={() => setCaptionsOpen(true)}
							onRemoveCaption={(language) => void handleRemoveCaption(language)}
							{...(removingLanguage ? { removingLanguage } : {})}
						/>
					) : (
						<div />
					)
				}
				error={video.error}
			/>
			<VideosCaptionUploadContainer
				videoId={id}
				open={captionsOpen}
				existingLanguages={found?.captionTracks.map((track) => track.language) ?? []}
				onClose={() => setCaptionsOpen(false)}
				onAttached={refreshPlayback}
			/>
		</>
	);
};
