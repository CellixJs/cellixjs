import { InboxOutlined } from '@ant-design/icons';
import { Alert, Button, Form, Input, Modal, Progress, Upload } from 'antd';
import { useState } from 'react';
import { type CaptionDetails, CaptionFields, type CaptionFile } from './videos-caption-fields.tsx';

/** What the API accepts, matching the domain's limits. */
const AcceptedVideoTypes = ['video/mp4', 'video/quicktime', 'video/webm'] as const;
export const MaxVideoSizeBytes = 2 * 1024 * 1024 * 1024;
const MaxTitleLength = 200;
/** Audio description formats and size the API accepts, matching the domain's limits. */
const AcceptedAudioDescriptionTypes = ['audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/wave'] as const;
export const MaxAudioDescriptionSizeBytes = 500 * 1024 * 1024;
/** How far the audio description's length may differ from the video's, matching the encoder. */
const AudioDescriptionToleranceSeconds = 1;

export interface VideosUploadValues {
	title: string;
	file: File;
	/** A caption file to attach once the video is uploaded. */
	caption?: CaptionDetails & { content: string };
	/** An English audio description: the soundtrack mixed with narration of what is on screen, the same length as the video. */
	audioDescription?: File;
}

interface VideosUploadProps {
	open: boolean;
	/** Upload progress from 0 to 100 while uploading. */
	progress?: number;
	uploading: boolean;
	error?: string;
	onSubmit: (values: VideosUploadValues) => void;
	onCancel: () => void;
	/** Reads a media file's length in seconds, or undefined when the browser cannot. Defaults to reading it with a media element. */
	readDuration?: (file: File) => Promise<number | undefined>;
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

/** Why an audio description file cannot be uploaded, or undefined when it can. */
export const validateAudioDescriptionFile = (file: Pick<File, 'type' | 'size'>): string | undefined => {
	if (!(AcceptedAudioDescriptionTypes as readonly string[]).includes(file.type)) {
		return 'Choose an M4A, AAC, MP3, or WAV audio file.';
	}
	if (file.size > MaxAudioDescriptionSizeBytes) {
		return 'Audio descriptions must be 500 MB or smaller.';
	}
	if (file.size === 0) {
		return 'The file is empty.';
	}
	return undefined;
};

/** Reads a media file's length from its metadata, or undefined when the browser cannot decode it. */
const readMediaDuration = (file: File): Promise<number | undefined> =>
	new Promise((resolve) => {
		const media = document.createElement(file.type.startsWith('audio/') ? 'audio' : 'video');
		const url = URL.createObjectURL(file);
		const done = (duration: number | undefined) => {
			URL.revokeObjectURL(url);
			resolve(duration !== undefined && Number.isFinite(duration) ? duration : undefined);
		};
		media.preload = 'metadata';
		media.onloadedmetadata = () => done(media.duration);
		media.onerror = () => done(undefined);
		media.src = url;
	});

const titleFromFileName = (name: string) => name.replace(/\.[^.]+$/, '').slice(0, MaxTitleLength);

export const VideosUpload: React.FC<VideosUploadProps> = ({ open, progress, uploading, error, onSubmit, onCancel, readDuration = readMediaDuration }) => {
	const [form] = Form.useForm<{ title: string; caption?: CaptionDetails }>();
	const [file, setFile] = useState<File>();
	const [fileError, setFileError] = useState<string>();
	const [captionFile, setCaptionFile] = useState<CaptionFile>();
	const [captionError, setCaptionError] = useState<string>();
	const [audioDescription, setAudioDescription] = useState<File>();
	const [audioDescriptionError, setAudioDescriptionError] = useState<string>();

	const reset = () => {
		form.resetFields();
		setFile(undefined);
		setFileError(undefined);
		setCaptionFile(undefined);
		setCaptionError(undefined);
		setAudioDescription(undefined);
		setAudioDescriptionError(undefined);
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

	const chooseAudioDescription = (chosen: File) => {
		const problem = validateAudioDescriptionFile(chosen);
		setAudioDescriptionError(problem);
		setAudioDescription(problem ? undefined : chosen);
		return false;
	};

	/** Why the audio description does not fit the video, when both lengths can be read; the encoder checks again. */
	const audioDescriptionMismatch = async (video: File, described: File): Promise<string | undefined> => {
		const [videoSeconds, describedSeconds] = await Promise.all([readDuration(video), readDuration(described)]);
		if (videoSeconds === undefined || describedSeconds === undefined || Math.abs(videoSeconds - describedSeconds) <= AudioDescriptionToleranceSeconds) {
			return undefined;
		}
		return `The audio description is ${describedSeconds.toFixed(1)} seconds long but the video is ${videoSeconds.toFixed(1)} seconds. They must be the same length.`;
	};

	const submit = async () => {
		const { title, caption } = await form.validateFields();
		if (!file) {
			setFileError('Choose a video to upload.');
			return;
		}
		if (captionError || audioDescriptionError) {
			return;
		}
		const mismatch = audioDescription ? await audioDescriptionMismatch(file, audioDescription) : undefined;
		if (mismatch) {
			setAudioDescriptionError(mismatch);
			return;
		}
		onSubmit({
			title: title.trim(),
			file,
			...(captionFile && caption ? { caption: { language: caption.language, label: caption.label.trim(), kind: caption.kind, content: captionFile.content } } : {}),
			...(audioDescription ? { audioDescription } : {}),
		});
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
				<CaptionFields
					optional
					namePrefix={['caption']}
					fileLabel="Captions"
					file={captionFile}
					fileError={captionError}
					onFileChange={(chosen, problem) => {
						setCaptionFile(chosen);
						setCaptionError(problem);
					}}
				/>
				<Form.Item
					label="Audio description (English)"
					extra="Optional. The soundtrack with narration describing what is on screen, the same length as the video. It can only be added now, with the upload."
				>
					<Upload
						accept={AcceptedAudioDescriptionTypes.join(',')}
						maxCount={1}
						showUploadList={false}
						beforeUpload={chooseAudioDescription}
					>
						<Button>{audioDescription ? audioDescription.name : 'Choose an audio file'}</Button>
					</Upload>
					{audioDescription ? (
						<Button
							type="link"
							onClick={() => {
								setAudioDescription(undefined);
								setAudioDescriptionError(undefined);
							}}
						>
							Remove audio description
						</Button>
					) : null}
					{audioDescriptionError ? (
						<Alert
							style={{ marginTop: 8 }}
							type="error"
							title={audioDescriptionError}
							showIcon
						/>
					) : null}
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
