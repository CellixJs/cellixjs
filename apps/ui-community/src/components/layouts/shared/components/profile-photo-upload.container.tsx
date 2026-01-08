import { Button, message } from 'antd';

export interface ProfilePhotoUploadContainerProps {
	data: {
		id: string;
		communityId: string;
	};
}

export const ProfilePhotoUploadContainer: React.FC<
	ProfilePhotoUploadContainerProps
> = (_props) => {
	// Placeholder implementation - full blob storage integration deferred
	const handleUpload = () => {
		message.info('Photo upload functionality coming soon');
	};

	return (
		<div style={{ marginBottom: 15 }}>
			<div>
				<Button onClick={handleUpload}>Upload Profile Photo</Button>
				<p style={{ marginTop: 8, color: '#8c8c8c', fontSize: '12px' }}>
					Profile photo upload (Azure Blob Storage integration pending)
				</p>
			</div>
		</div>
	);
};
