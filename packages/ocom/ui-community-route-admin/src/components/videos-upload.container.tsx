import { useMutation } from '@apollo/client';
import { App } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { AdminVideosUploadContainerCompleteUploadDocument, AdminVideosUploadContainerRequestUploadDocument } from '../generated.tsx';
import { VideosUpload, type VideosUploadValues } from './videos-upload.tsx';

/**
 * PUTs a file to a signed storage URL, reporting progress. `fetch` cannot
 * report upload progress, so this uses XMLHttpRequest.
 */
const putFileWithProgress = (url: string, headers: { name: string; value: string }[], file: File, onProgress: (percent: number) => void, signal: AbortSignal): Promise<void> =>
	new Promise((resolve, reject) => {
		const request = new XMLHttpRequest();
		request.open('PUT', url);
		for (const header of headers) {
			request.setRequestHeader(header.name, header.value);
		}
		request.upload.onprogress = (event) => {
			if (event.lengthComputable) {
				onProgress((event.loaded / event.total) * 100);
			}
		};
		request.onload = () => (request.status >= 200 && request.status < 300 ? resolve() : reject(new Error(`The upload failed (HTTP ${request.status}). Try again.`)));
		request.onerror = () => reject(new Error('The upload failed. Check your connection and try again.'));
		request.onabort = () => reject(new Error('The upload was cancelled.'));
		signal.addEventListener('abort', () => request.abort(), { once: true });
		request.send(file);
	});

interface VideosUploadContainerProps {
	open: boolean;
	onClose: () => void;
	onUploaded: () => void;
}

export const VideosUploadContainer: React.FC<VideosUploadContainerProps> = ({ open, onClose, onUploaded }) => {
	const { message } = App.useApp();
	const [requestUpload] = useMutation(AdminVideosUploadContainerRequestUploadDocument);
	const [completeUpload] = useMutation(AdminVideosUploadContainerCompleteUploadDocument);
	const [uploading, setUploading] = useState(false);
	const [progress, setProgress] = useState(0);
	const [error, setError] = useState<string>();
	const abort = useRef<AbortController | null>(null);

	// Stop an upload in progress if the page is left.
	useEffect(() => () => abort.current?.abort(), []);

	const handleSubmit = async ({ title, file }: VideosUploadValues) => {
		setUploading(true);
		setProgress(0);
		setError(undefined);
		abort.current = new AbortController();
		try {
			const requested = await requestUpload({ variables: { input: { title, contentType: file.type, sizeBytes: file.size } } });
			const result = requested.data?.videoRequestUpload;
			if (!result?.status.success || !result.video || !result.upload) {
				throw new Error(result?.status.errorMessage ?? 'The upload could not be started.');
			}
			await putFileWithProgress(result.upload.url, result.upload.headers, file, setProgress, abort.current.signal);
			const completed = await completeUpload({ variables: { input: { id: result.video.id } } });
			if (!completed.data?.videoCompleteUpload.status.success) {
				throw new Error(completed.data?.videoCompleteUpload.status.errorMessage ?? 'The upload could not be confirmed.');
			}
			message.success(`"${title}" was uploaded. Staff will prepare it for streaming.`);
			onUploaded();
			onClose();
		} catch (caught) {
			setError((caught as Error).message);
		} finally {
			setUploading(false);
		}
	};

	return (
		<VideosUpload
			open={open}
			uploading={uploading}
			progress={progress}
			{...(error ? { error } : {})}
			onSubmit={(values) => void handleSubmit(values)}
			onCancel={() => {
				setError(undefined);
				onClose();
			}}
		/>
	);
};
