import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { MaxVideoSizeBytes, VideosUpload, validateVideoFile } from './videos-upload.tsx';

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

const fileInput = () => document.body.querySelector('input[type="file"]:not([accept=".vtt,.srt"])') as HTMLInputElement;
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
