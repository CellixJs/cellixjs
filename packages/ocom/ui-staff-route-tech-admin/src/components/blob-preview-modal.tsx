import { Button, Modal, Spin, Typography } from 'antd';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';

const { Text } = Typography;

export interface BlobPreviewModalProps {
	open: boolean;
	blobName: string;
	contentType?: string | null;
	downloadUrl?: string;
	authorizationHeader?: string;
	onClose: () => void;
	loading?: boolean;
}

export const BlobPreviewModal: React.FC<BlobPreviewModalProps> = ({ open, blobName, contentType, downloadUrl, authorizationHeader, onClose, loading }) => {
	const [textContent, setTextContent] = useState<string | null>(null);
	const [fetchError, setFetchError] = useState<string | null>(null);

	const isImage = contentType?.startsWith('image/');
	const isPdf = contentType === 'application/pdf';
	const isText = contentType?.startsWith('text/') || contentType === 'application/json';

	const fetchText = useCallback(async () => {
		if (!downloadUrl || !isText) return;
		try {
			const headersInit: HeadersInit = authorizationHeader ? { Authorization: authorizationHeader } : {};
			const response = await fetch(downloadUrl, { headers: headersInit });
			const text = await response.text();
			setTextContent(text);
		} catch (err) {
			setFetchError(String(err));
		}
	}, [downloadUrl, authorizationHeader, isText]);

	useEffect(() => {
		if (open && isText && downloadUrl) {
			void fetchText();
		} else {
			setTextContent(null);
			setFetchError(null);
		}
	}, [open, isText, downloadUrl, fetchText]);

	const handleDownload = () => {
		if (!downloadUrl) return;
		const link = document.createElement('a');
		link.href = downloadUrl;
		if (authorizationHeader) {
			// For authenticated downloads we open in a new tab; the client handles auth
			window.open(downloadUrl, '_blank');
		} else {
			link.download = blobName.split('/').pop() ?? blobName;
			link.click();
		}
	};

	const renderPreview = () => {
		if (loading) return <Spin />;
		if (!downloadUrl) return <Text type="secondary">No preview available</Text>;
		if (isImage)
			return (
				<img
					src={downloadUrl}
					alt={blobName}
					style={{ maxWidth: '100%' }}
				/>
			);
		if (isPdf)
			return (
				<iframe
					src={downloadUrl}
					title={blobName}
					style={{ width: '100%', height: '60vh', border: 'none' }}
				/>
			);
		if (isText) {
			if (fetchError) return <Text type="danger">Error loading content: {fetchError}</Text>;
			if (textContent === null) return <Spin />;
			return <pre style={{ maxHeight: '60vh', overflow: 'auto', fontSize: 12 }}>{textContent}</pre>;
		}
		return <Text type="secondary">Preview not available for this file type ({contentType ?? 'unknown'})</Text>;
	};

	return (
		<Modal
			open={open}
			title={blobName.split('/').pop() ?? blobName}
			onCancel={onClose}
			width="80%"
			footer={[
				<Button
					key="download"
					type="primary"
					onClick={handleDownload}
					disabled={!downloadUrl}
				>
					Download
				</Button>,
				<Button
					key="close"
					onClick={onClose}
				>
					Close
				</Button>,
			]}
		>
			{renderPreview()}
		</Modal>
	);
};
