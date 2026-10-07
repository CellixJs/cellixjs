import { Alert, Form, Modal } from 'antd';
import { useState } from 'react';
import { type CaptionDetails, CaptionFields, type CaptionFile } from './videos-caption-fields.tsx';

export interface VideosCaptionUploadValues extends CaptionDetails {
	content: string;
}

interface VideosCaptionUploadProps {
	open: boolean;
	saving: boolean;
	error?: string;
	/** Languages the video already has captions in; attaching one replaces it. */
	existingLanguages: readonly string[];
	onSubmit: (values: VideosCaptionUploadValues) => void;
	onCancel: () => void;
}

export const VideosCaptionUpload: React.FC<VideosCaptionUploadProps> = ({ open, saving, error, existingLanguages, onSubmit, onCancel }) => {
	const [form] = Form.useForm<CaptionDetails>();
	const [file, setFile] = useState<CaptionFile>();
	const [fileError, setFileError] = useState<string>();

	const reset = () => {
		form.resetFields();
		setFile(undefined);
		setFileError(undefined);
	};

	const submit = async () => {
		const values = await form.validateFields();
		if (!file) {
			setFileError('Choose a caption file.');
			return;
		}
		onSubmit({ language: values.language, label: values.label.trim(), kind: values.kind, content: file.content });
	};

	return (
		<Modal
			open={open}
			title="Add Captions"
			okText="Add"
			confirmLoading={saving}
			cancelButtonProps={{ disabled: saving }}
			onOk={() => void submit()}
			onCancel={onCancel}
			afterClose={reset}
			destroyOnHidden
		>
			<Form
				form={form}
				layout="vertical"
				disabled={saving}
			>
				<CaptionFields
					file={file}
					fileError={fileError}
					existingLanguages={existingLanguages}
					onFileChange={(chosen, problem) => {
						setFile(chosen);
						setFileError(problem);
					}}
				/>
			</Form>
			{error ? (
				<Alert
					type="error"
					title={error}
					showIcon
				/>
			) : null}
		</Modal>
	);
};
