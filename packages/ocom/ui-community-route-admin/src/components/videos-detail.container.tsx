import { useMutation, useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import type { VideoPlayerHandle } from '@cellix/ui-video-player';
import { App } from 'antd';
import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
	AdminVideosDetailContainerPlaybackDocument,
	AdminVideosDetailContainerRecordProgressDocument,
	AdminVideosDetailContainerRemoveCaptionDocument,
	AdminVideosDetailContainerVideoDocument,
	AdminVideosDetailContainerViewingsDocument,
} from '../generated.tsx';
import { type PlayedRange, useWatchProgressReporter } from './use-watch-progress-reporter.ts';
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
	const viewings = useQuery(AdminVideosDetailContainerViewingsDocument, { variables: { id }, skip: !isReady });
	const [removeCaption] = useMutation(AdminVideosDetailContainerRemoveCaptionDocument);
	const [recordProgress] = useMutation(AdminVideosDetailContainerRecordProgressDocument);
	const [playerElement, setPlayerElement] = useState<HTMLVideoElement>();
	const found = video.data?.videoById;
	const links = playback.data?.videoPlayback;
	const watched = viewings.data?.videoById;

	// The first report creates the viewing, so refetch to show it; later reports update it in the cache by id.
	const hasViewing = Boolean(watched?.myViewing);
	const reportProgress = useCallback(
		async (ranges: PlayedRange[], position: number) => {
			const result = await recordProgress({ variables: { input: { id, ranges, position } } });
			const status = result.data?.videoRecordProgress.status;
			if (!status?.success) {
				console.error('Watch progress was not saved:', status?.errorMessage);
				return false;
			}
			if (!hasViewing) {
				void viewings.refetch();
			}
			return true;
		},
		[id, recordProgress, hasViewing, viewings.refetch],
	);
	useWatchProgressReporter(playerElement, reportProgress);

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
							{...(watched ? { viewings: { mine: watched.myViewing, all: watched.viewings } } : {})}
							onPlayerReady={(handle: VideoPlayerHandle) => setPlayerElement(handle.element)}
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
