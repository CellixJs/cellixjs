import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { MaxCaptionFileBytes, VideosCaptionUpload, validateCaptionFile } from './videos-caption-upload.tsx';

const meta: Meta<typeof VideosCaptionUpload> = {
	title: 'Admin/Components/VideosCaptionUpload',
	component: VideosCaptionUpload,
	tags: ['autodocs'],
	args: { open: true, saving: false, existingLanguages: [], onSubmit: fn(), onCancel: fn() },
};

export default meta;
type Story = StoryObj<typeof meta>;

const srt = '1\n00:00:01,000 --> 00:00:03,000\nBienvenidos.\n';
const fileInput = () => document.body.querySelector('input[type="file"]') as HTMLInputElement;
const chooseLanguage = async (name: RegExp) => {
	const body = within(document.body);
	await userEvent.click(body.getByRole('combobox'));
	await userEvent.click(await body.findByTitle(name));
};

export const ChooseFileAndLanguage: Story = {
	play: async ({ args }) => {
		const body = within(document.body);
		await userEvent.upload(fileInput(), new File([srt], 'spanish.srt', { type: 'application/x-subrip' }));
		await expect(await body.findByText('spanish.srt')).toBeInTheDocument();

		await chooseLanguage(/\(es\)$/);
		// The name defaults to the language's own name.
		await waitFor(() => expect(body.getByLabelText('Name in the player')).toHaveValue('Español'));
		await userEvent.click(body.getByLabelText(/Subtitles/));

		await userEvent.click(body.getByRole('button', { name: 'Add' }));
		await waitFor(() => expect(args.onSubmit).toHaveBeenCalledWith({ language: 'es', label: 'Español', kind: 'SUBTITLES', content: srt }));
	},
};

export const WarnsBeforeReplacing: Story = {
	args: { existingLanguages: ['en'] },
	play: async () => {
		await chooseLanguage(/\(en\)$/);
		await expect(await within(document.body).findByText('This replaces the existing captions in this language.')).toBeInTheDocument();
	},
};

export const RequiresAFile: Story = {
	play: async ({ args }) => {
		const body = within(document.body);
		await chooseLanguage(/\(fr\)$/);
		await userEvent.click(body.getByRole('button', { name: 'Add' }));
		await expect(await body.findByText('Choose a caption file.')).toBeInTheDocument();
		await expect(args.onSubmit).not.toHaveBeenCalled();
	},
};

export const RejectsOtherFiles: Story = {
	play: async () => {
		await userEvent.upload(fileInput(), new File(['notes'], 'notes.txt', { type: 'text/plain' }), { applyAccept: false });
		await expect(await within(document.body).findByText('Choose a WebVTT (.vtt) or SubRip (.srt) file.')).toBeInTheDocument();
		await expect(validateCaptionFile({ name: 'big.vtt', size: MaxCaptionFileBytes + 1 })).toBe('Caption files must be 1 MB or smaller.');
		await expect(validateCaptionFile({ name: 'empty.SRT', size: 0 })).toBe('The file is empty.');
		await expect(validateCaptionFile({ name: 'ok.vtt', size: 10 })).toBeUndefined();
	},
};

export const SaveError: Story = {
	args: { error: 'The WebVTT file has no captions' },
	play: async () => {
		await expect(within(document.body).getByText('The WebVTT file has no captions')).toBeInTheDocument();
	},
};
