import { useMutation } from '@apollo/client';
import { App } from 'antd';
import { useState } from 'react';
import { AdminVideosCaptionUploadContainerAttachCaptionDocument } from '../generated.tsx';
import { VideosCaptionUpload, type VideosCaptionUploadValues } from './videos-caption-upload.tsx';

interface VideosCaptionUploadContainerProps {
	videoId: string;
	open: boolean;
	existingLanguages: readonly string[];
	onClose: () => void;
	onAttached: () => void;
}

export const VideosCaptionUploadContainer: React.FC<VideosCaptionUploadContainerProps> = ({ videoId, open, existingLanguages, onClose, onAttached }) => {
	const { message } = App.useApp();
	const [attachCaption, { loading }] = useMutation(AdminVideosCaptionUploadContainerAttachCaptionDocument);
	const [error, setError] = useState<string>();

	const handleSubmit = async (values: VideosCaptionUploadValues) => {
		setError(undefined);
		try {
			const result = await attachCaption({ variables: { input: { id: videoId, ...values } } });
			const status = result.data?.videoAttachCaption.status;
			if (!status?.success) {
				throw new Error(status?.errorMessage ?? 'The captions could not be added.');
			}
			message.success(`${values.label} captions were added.`);
			onAttached();
			onClose();
		} catch (caught) {
			setError((caught as Error).message);
		}
	};

	return (
		<VideosCaptionUpload
			open={open}
			saving={loading}
			existingLanguages={existingLanguages}
			{...(error ? { error } : {})}
			onSubmit={(values) => void handleSubmit(values)}
			onCancel={() => {
				setError(undefined);
				onClose();
			}}
		/>
	);
};
