import { InboxOutlined } from '@ant-design/icons';
import { Alert, Button, Form, Input, Radio, Select, Upload } from 'antd';
import { useEffect, useRef } from 'react';
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

/** A caption file read in the browser; its text is sent to the API. */
export interface CaptionFile {
	name: string;
	content: string;
}

/** The caption details collected by {@link CaptionFields}. */
export interface CaptionDetails {
	language: string;
	label: string;
	kind: VideoCaptionKind;
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

interface CaptionFieldsProps {
	file: CaptionFile | undefined;
	fileError: string | undefined;
	/** Called with the chosen file once read, or with the reason it cannot be used. */
	onFileChange: (file: CaptionFile | undefined, error: string | undefined) => void;
	/** Field names are nested under this path in the surrounding form. */
	namePrefix?: string[];
	fileLabel?: string;
	/** Languages the video already has captions in; choosing one replaces it. */
	existingLanguages?: readonly string[];
	/** Optional captions show language, name, and type only once a file is chosen, and can be cleared. */
	optional?: boolean;
}

/**
 * The caption file, language, name, and type fields, for use inside an antd
 * `Form`. The name defaults to the chosen language's own name.
 */
export const CaptionFields: React.FC<CaptionFieldsProps> = ({ file, fileError, onFileChange, namePrefix = [], fileLabel = 'Caption file', existingLanguages = [], optional = false }) => {
	const form = Form.useFormInstance();
	const field = (name: keyof CaptionDetails) => [...namePrefix, name];
	const language = Form.useWatch(field('language'), form) as string | undefined;
	const previousLanguage = useRef(language);

	useEffect(() => {
		if (language && language !== previousLanguage.current) {
			form.setFieldValue(field('label'), capitalize(languageName(language)).slice(0, MaxLabelLength));
		}
		previousLanguage.current = language;
	}, [language]);

	const chooseFile = (chosen: File) => {
		const problem = validateCaptionFile(chosen);
		onFileChange(undefined, problem);
		if (!problem) {
			void chosen.text().then((content) => onFileChange({ name: chosen.name, content }, undefined));
		}
		// Read the file in the browser instead of uploading it.
		return false;
	};

	const showDetails = !optional || Boolean(file);
	return (
		<>
			<Form.Item
				label={fileLabel}
				{...(optional ? { extra: 'Optional. You can also add captions later from the video’s page.' } : {})}
			>
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
				{optional && file ? (
					<Button
						type="link"
						onClick={() => onFileChange(undefined, undefined)}
					>
						Remove caption file
					</Button>
				) : null}
				{fileError ? (
					<Alert
						style={{ marginTop: 8 }}
						type="error"
						title={fileError}
						showIcon
					/>
				) : null}
			</Form.Item>
			{showDetails ? (
				<>
					<Form.Item
						name={field('language')}
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
						name={field('label')}
						label="Name in the player"
						rules={[{ required: true, whitespace: true, message: 'Enter a name.' }]}
					>
						<Input maxLength={MaxLabelLength} />
					</Form.Item>
					<Form.Item
						name={field('kind')}
						label="Type"
						initialValue="CAPTIONS"
					>
						<Radio.Group
							options={[
								{ value: 'CAPTIONS', label: 'Captions (speech and sounds)' },
								{ value: 'SUBTITLES', label: 'Subtitles (translation)' },
							]}
						/>
					</Form.Item>
				</>
			) : null}
		</>
	);
};
