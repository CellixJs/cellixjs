import { InboxOutlined } from '@ant-design/icons';
import { Alert, Form, Input, Modal, Radio, Select, Upload } from 'antd';
import { useState } from 'react';
import type { VideoCaptionKind } from '../generated.tsx';

/** Matches the API's limit. */
export const MaxCaptionFileBytes = 1024 * 1024;
const MaxLabelLength = 50;

/** Common languages offered in the picker, as BCP 47 tags. */
const CommonLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko', 'vi', 'tl', 'ar', 'hi', 'ru', 'uk', 'pl', 'nl', 'sv', 'ht', 'fa'];

const languageName = (language: string): string => {
	try {
		return new Intl.DisplayNames([language], { type: 'language' }).of(language) ?? language;
	} catch {
		return language;
	}
};
const capitalize = (text: string) => text.charAt(0).toLocaleUpperCase() + text.slice(1);

export interface VideosCaptionUploadValues {
	language: string;
	label: string;
	kind: VideoCaptionKind;
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

/** Why a caption file cannot be attached, or undefined when it can. */
export const validateCaptionFile = (file: Pick<File, 'name' | 'size'>): string | undefined => {
	if (!/\.(vtt|srt)$/i.test(file.name)) {
		return 'Choose a WebVTT (.vtt) or SubRip (.srt) file.';
	}
	if (file.size > MaxCaptionFileBytes) {
		return 'Caption files must be 1 MB or smaller.';
	}
	if (file.size === 0) {
		return 'The file is empty.';
	}
	return undefined;
};

export const VideosCaptionUpload: React.FC<VideosCaptionUploadProps> = ({ open, saving, error, existingLanguages, onSubmit, onCancel }) => {
	const [form] = Form.useForm<{ language: string; label: string; kind: VideoCaptionKind }>();
	const [file, setFile] = useState<{ name: string; content: string }>();
	const [fileError, setFileError] = useState<string>();
	const language = Form.useWatch('language', form);

	const reset = () => {
		form.resetFields();
		setFile(undefined);
		setFileError(undefined);
	};

	const chooseFile = (chosen: File) => {
		const problem = validateCaptionFile(chosen);
		setFileError(problem);
		setFile(undefined);
		if (!problem) {
			void chosen.text().then((content) => setFile({ name: chosen.name, content }));
		}
		// Read the file in the browser; the container sends its text to the API.
		return false;
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
				initialValues={{ kind: 'CAPTIONS' }}
				onValuesChange={(changed: { language?: string }) => {
					if (changed.language) {
						form.setFieldsValue({ label: capitalize(languageName(changed.language)).slice(0, MaxLabelLength) });
					}
				}}
			>
				<Form.Item label="Caption file">
					<Upload.Dragger
						accept=".vtt,.srt"
						maxCount={1}
						showUploadList={false}
						beforeUpload={chooseFile}
					>
						<p className="ant-upload-drag-icon">
							<InboxOutlined />
						</p>
						<p className="ant-upload-text">{file ? file.name : 'Click or drag a caption file here'}</p>
						<p className="ant-upload-hint">WebVTT (.vtt) or SubRip (.srt), up to 1 MB</p>
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
					name="language"
					label="Language"
					rules={[{ required: true, message: 'Choose a language.' }]}
					{...(language && existingLanguages.includes(language) ? { extra: 'This replaces the existing captions in this language.' } : {})}
				>
					<Select
						showSearch
						optionFilterProp="label"
						placeholder="Choose a language"
						options={CommonLanguages.map((tag) => ({ value: tag, label: `${capitalize(languageName(tag))} (${tag})` }))}
					/>
				</Form.Item>
				<Form.Item
					name="label"
					label="Name in the player"
					rules={[{ required: true, whitespace: true, message: 'Enter a name.' }]}
				>
					<Input maxLength={MaxLabelLength} />
				</Form.Item>
				<Form.Item
					name="kind"
					label="Type"
				>
					<Radio.Group
						options={[
							{ value: 'CAPTIONS', label: 'Captions (speech and sounds)' },
							{ value: 'SUBTITLES', label: 'Subtitles (translation)' },
						]}
					/>
				</Form.Item>
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
