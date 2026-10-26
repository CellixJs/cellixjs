import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { MaxAudioDescriptionSizeBytes, MaxVideoSizeBytes, VideosUpload, validateAudioDescriptionFile, validateVideoFile } from './videos-upload.tsx';

const meta: Meta<typeof VideosUpload> = {
	title: 'Admin/Components/VideosUpload',
	component: VideosUpload,
	tags: ['autodocs'],
	args: {
		open: true,
		uploading: false,
		onSubmit: fn(),
		onCancel: fn(),
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

const fileInput = () => document.body.querySelector('input[type="file"][accept^="video/"]') as HTMLInputElement;
const audioDescriptionInput = () => document.body.querySelector('input[type="file"][accept^="audio/"]') as HTMLInputElement;
const captionInput = () => document.body.querySelector('input[type="file"][accept=".vtt,.srt"]') as HTMLInputElement;
const vtt = 'WEBVTT\n\n00:01.000 --> 00:03.000\nWelcome.\n';

export const ChooseAndSubmit: Story = {
	play: async ({ args }) => {
		const body = within(document.body);
		const file = new File(['video-bytes'], 'Pool opening.mp4', { type: 'video/mp4' });
		await userEvent.upload(fileInput(), file);

		// The title defaults to the file name.
		await waitFor(() => expect(body.getByLabelText('Title')).toHaveValue('Pool opening'));
		await expect(body.getByText('Pool opening.mp4')).toBeInTheDocument();

		await userEvent.click(body.getByRole('button', { name: 'Upload' }));
		await waitFor(() => expect(args.onSubmit).toHaveBeenCalledWith({ title: 'Pool opening', file }));
	},
};

export const UploadWithCaptions: Story = {
	play: async ({ args }) => {
		const body = within(document.body);
		const file = new File(['video-bytes'], 'Pool opening.mp4', { type: 'video/mp4' });
		await userEvent.upload(fileInput(), file);
		// Caption details appear only once a caption file is chosen.
		await expect(body.queryByLabelText('Language')).toBeNull();
		await userEvent.upload(captionInput(), new File([vtt], 'english.vtt', { type: 'text/vtt' }));
		await userEvent.click(await body.findByRole('combobox'));
		await userEvent.click(await body.findByTitle(/\(en\)$/));
		await waitFor(() => expect(body.getByLabelText('Name in the player')).toHaveValue('English'));

		await userEvent.click(body.getByRole('button', { name: 'Upload' }));
		await waitFor(() => expect(args.onSubmit).toHaveBeenCalledWith({ title: 'Pool opening', file, caption: { language: 'en', label: 'English', kind: 'CAPTIONS', content: vtt } }));
	},
};

export const CaptionsCanBeRemovedBeforeUploading: Story = {
	play: async ({ args }) => {
		const body = within(document.body);
		const file = new File(['video-bytes'], 'Pool opening.mp4', { type: 'video/mp4' });
		await userEvent.upload(fileInput(), file);
		await userEvent.upload(captionInput(), new File([vtt], 'english.vtt', { type: 'text/vtt' }));
		await userEvent.click(await body.findByRole('button', { name: 'Remove caption file' }));
		await expect(body.queryByLabelText('Language')).toBeNull();

		await userEvent.click(body.getByRole('button', { name: 'Upload' }));
		await waitFor(() => expect(args.onSubmit).toHaveBeenCalledWith({ title: 'Pool opening', file }));
	},
};

export const RejectsOtherCaptionFiles: Story = {
	play: async ({ args }) => {
		const body = within(document.body);
		await userEvent.upload(fileInput(), new File(['video-bytes'], 'Pool opening.mp4', { type: 'video/mp4' }));
		await userEvent.upload(captionInput(), new File(['notes'], 'notes.txt', { type: 'text/plain' }), { applyAccept: false });
		await expect(await body.findByText('Choose a WebVTT (.vtt) or SubRip (.srt) file.')).toBeInTheDocument();

		await userEvent.click(body.getByRole('button', { name: 'Upload' }));
		await expect(args.onSubmit).not.toHaveBeenCalled();
	},
};

export const UploadWithAudioDescription: Story = {
	args: { readDuration: (file: File) => Promise.resolve(file.type.startsWith('audio/') ? 120.4 : 120) },
	play: async ({ args }) => {
		const body = within(document.body);
		const file = new File(['video-bytes'], 'Pool opening.mp4', { type: 'video/mp4' });
		const described = new File(['described-bytes'], 'Pool opening described.m4a', { type: 'audio/mp4' });
		await userEvent.upload(fileInput(), file);
		await userEvent.upload(audioDescriptionInput(), described);
		await expect(await body.findByRole('button', { name: 'Pool opening described.m4a' })).toBeInTheDocument();

		await userEvent.click(body.getByRole('button', { name: 'Upload' }));
		await waitFor(() => expect(args.onSubmit).toHaveBeenCalledWith({ title: 'Pool opening', file, audioDescription: described }));
	},
};

export const RejectsAnAudioDescriptionOfADifferentLength: Story = {
	args: { readDuration: (file: File) => Promise.resolve(file.type.startsWith('audio/') ? 95 : 120) },
	play: async ({ args }) => {
		const body = within(document.body);
		await userEvent.upload(fileInput(), new File(['video-bytes'], 'Pool opening.mp4', { type: 'video/mp4' }));
		await userEvent.upload(audioDescriptionInput(), new File(['described-bytes'], 'described.m4a', { type: 'audio/mp4' }));

		await userEvent.click(body.getByRole('button', { name: 'Upload' }));
		await expect(await body.findByText('The audio description is 95.0 seconds long but the video is 120.0 seconds. They must be the same length.')).toBeInTheDocument();
		await expect(args.onSubmit).not.toHaveBeenCalled();

		// Removing it clears the problem and uploads the video alone.
		await userEvent.click(body.getByRole('button', { name: 'Remove audio description' }));
		await userEvent.click(body.getByRole('button', { name: 'Upload' }));
		await waitFor(() => expect(args.onSubmit).toHaveBeenCalledWith(expect.not.objectContaining({ audioDescription: expect.anything() })));
	},
};

export const UploadsAnAudioDescriptionWhoseLengthCannotBeRead: Story = {
	args: { readDuration: () => Promise.resolve(undefined) },
	play: async ({ args }) => {
		const body = within(document.body);
		const described = new File(['described-bytes'], 'described.wav', { type: 'audio/wav' });
		await userEvent.upload(fileInput(), new File(['video-bytes'], 'Pool opening.mov', { type: 'video/quicktime' }));
		await userEvent.upload(audioDescriptionInput(), described);

		// The encoder checks the length again, so an unreadable file is not blocked here.
		await userEvent.click(body.getByRole('button', { name: 'Upload' }));
		await waitFor(() => expect(args.onSubmit).toHaveBeenCalledWith(expect.objectContaining({ audioDescription: described })));
	},
};

export const RejectsOtherAudioDescriptionFiles: Story = {
	play: async ({ args }) => {
		const body = within(document.body);
		await userEvent.upload(fileInput(), new File(['video-bytes'], 'Pool opening.mp4', { type: 'video/mp4' }));
		await userEvent.upload(audioDescriptionInput(), new File(['notes'], 'notes.txt', { type: 'text/plain' }), { applyAccept: false });
		await expect(await body.findByText('Choose an M4A, AAC, MP3, or WAV audio file.')).toBeInTheDocument();

		await userEvent.click(body.getByRole('button', { name: 'Upload' }));
		await expect(args.onSubmit).not.toHaveBeenCalled();
		await expect(validateAudioDescriptionFile({ type: 'audio/mpeg', size: MaxAudioDescriptionSizeBytes + 1 })).toBe('Audio descriptions must be 500 MB or smaller.');
		await expect(validateAudioDescriptionFile({ type: 'audio/x-m4a', size: 0 })).toBe('The file is empty.');
		await expect(validateAudioDescriptionFile({ type: 'audio/x-wav', size: 10 })).toBeUndefined();
	},
};

export const RequiresAFile: Story = {
	play: async ({ args }) => {
		const body = within(document.body);
		await userEvent.type(body.getByLabelText('Title'), 'Garden tour');
		await userEvent.click(body.getByRole('button', { name: 'Upload' }));

		await expect(await body.findByText('Choose a video to upload.')).toBeInTheDocument();
		await expect(args.onSubmit).not.toHaveBeenCalled();
	},
};

export const RejectsOtherFiles: Story = {
	play: async () => {
		const body = within(document.body);
		// applyAccept is off so the picker's filter does not hide the file from the component.
		await userEvent.upload(fileInput(), new File(['text'], 'notes.txt', { type: 'text/plain' }), { applyAccept: false });

		await expect(await body.findByText('Choose an MP4, MOV, or WebM video.')).toBeInTheDocument();
		await expect(validateVideoFile({ type: 'video/webm', size: MaxVideoSizeBytes + 1 })).toBe('Videos must be 2 GB or smaller.');
		await expect(validateVideoFile({ type: 'video/quicktime', size: 0 })).toBe('The file is empty.');
		await expect(validateVideoFile({ type: 'video/quicktime', size: 10 })).toBeUndefined();
	},
};

export const Uploading: Story = {
	args: { uploading: true, progress: 42.7 },
	play: async () => {
		const body = within(document.body);
		await expect(body.getByText('42%')).toBeInTheDocument();
		await expect(body.getByRole('button', { name: /Cancel/ })).toBeDisabled();
	},
};

export const UploadError: Story = {
	args: { error: 'The upload failed. Check your connection and try again.' },
	play: async () => {
		await expect(within(document.body).getByText('The upload failed. Check your connection and try again.')).toBeInTheDocument();
	},
};
