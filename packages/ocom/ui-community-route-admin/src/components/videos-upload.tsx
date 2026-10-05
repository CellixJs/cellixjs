import { InboxOutlined } from '@ant-design/icons';
import { Alert, Form, Input, Modal, Progress, Upload } from 'antd';
import { useState } from 'react';

/** What the API accepts, matching the domain's limits. */
const AcceptedVideoTypes = ['video/mp4', 'video/quicktime', 'video/webm'] as const;
export const MaxVideoSizeBytes = 2 * 1024 * 1024 * 1024;
const MaxTitleLength = 200;

export interface VideosUploadValues {
	title: string;
	file: File;
}

interface VideosUploadProps {
	open: boolean;
	/** Upload progress from 0 to 100 while uploading. */
	progress?: number;
	uploading: boolean;
	error?: string;
	onSubmit: (values: VideosUploadValues) => void;
	onCancel: () => void;
}

/** Why a file cannot be uploaded, or undefined when it can. */
export const validateVideoFile = (file: Pick<File, 'type' | 'size'>): string | undefined => {
	if (!(AcceptedVideoTypes as readonly string[]).includes(file.type)) {
		return 'Choose an MP4, MOV, or WebM video.';
	}
	if (file.size > MaxVideoSizeBytes) {
		return 'Videos must be 2 GB or smaller.';
	}
	if (file.size === 0) {
		return 'The file is empty.';
	}
	return undefined;
};

const titleFromFileName = (name: string) => name.replace(/\.[^.]+$/, '').slice(0, MaxTitleLength);

export const VideosUpload: React.FC<VideosUploadProps> = ({ open, progress, uploading, error, onSubmit, onCancel }) => {
	const [form] = Form.useForm<{ title: string }>();
	const [file, setFile] = useState<File>();
	const [fileError, setFileError] = useState<string>();

	const reset = () => {
		form.resetFields();
		setFile(undefined);
		setFileError(undefined);
	};

	const chooseFile = (chosen: File) => {
		const problem = validateVideoFile(chosen);
		setFileError(problem);
		setFile(problem ? undefined : chosen);
		if (!problem && !form.getFieldValue('title')) {
			form.setFieldsValue({ title: titleFromFileName(chosen.name) });
		}
		// Keep the file in the browser; the container uploads it.
		return false;
	};

	const submit = async () => {
		const { title } = await form.validateFields();
		if (!file) {
			setFileError('Choose a video to upload.');
			return;
		}
		onSubmit({ title: title.trim(), file });
	};

	return (
		<Modal
			open={open}
			title="Upload Video"
			okText="Upload"
			okButtonProps={{ disabled: uploading }}
			confirmLoading={uploading}
			cancelButtonProps={{ disabled: uploading }}
			closable={!uploading}
			mask={{ closable: false }}
			onOk={() => void submit()}
			onCancel={onCancel}
			afterClose={reset}
			destroyOnHidden
		>
			<Form
				form={form}
				layout="vertical"
				disabled={uploading}
			>
				<Form.Item label="Video">
					<Upload.Dragger
						accept={AcceptedVideoTypes.join(',')}
						maxCount={1}
						showUploadList={false}
						beforeUpload={chooseFile}
					>
						<p className="ant-upload-drag-icon">
							<InboxOutlined />
						</p>
						<p className="ant-upload-text">{file ? file.name : 'Click or drag a video here'}</p>
						<p className="ant-upload-hint">MP4, MOV, or WebM, up to 2 GB</p>
					</Upload.Dragger>
					{fileError ? (
						<Alert
							style={{ marginTop: 8 }}
							type="error"
							title={fileError}
							showIcon
						/>
					) : null}
				</Form.Item>
				<Form.Item
					name="title"
					label="Title"
					rules={[{ required: true, whitespace: true, message: 'Enter a title.' }]}
				>
					<Input
						maxLength={MaxTitleLength}
						showCount
					/>
				</Form.Item>
			</Form>
			{uploading ? <Progress percent={Math.floor(progress ?? 0)} /> : null}
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
