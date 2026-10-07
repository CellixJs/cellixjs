import type { MockedResponse } from '@apollo/client/testing';
import { MockedProvider } from '@apollo/client/testing';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { App } from 'antd';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { AdminVideosUploadContainerAttachCaptionDocument, AdminVideosUploadContainerCompleteUploadDocument, AdminVideosUploadContainerRequestUploadDocument } from '../generated.tsx';
import { VideosUploadContainer } from './videos-upload.container.tsx';

const videoId = '6ac40e30cbfbc8b59ab74e81';
const uploadUrl = `https://storage.example/video-uploads/c1/${videoId}?signed`;
const file = new File(['video-bytes'], 'Pool opening.mp4', { type: 'video/mp4' });

const requestUploadMock: MockedResponse = {
	request: { query: AdminVideosUploadContainerRequestUploadDocument, variables: { input: { title: 'Pool opening', contentType: 'video/mp4', sizeBytes: file.size } } },
	result: {
		data: {
			videoRequestUpload: {
				__typename: 'VideoRequestUploadMutationResult',
				status: { __typename: 'MutationStatus', success: true, errorMessage: null },
				video: { __typename: 'Video', id: videoId },
				upload: {
					__typename: 'VideoUploadTarget',
					url: uploadUrl,
					headers: [
						{ __typename: 'HttpHeader', name: 'x-ms-blob-type', value: 'BlockBlob' },
						{ __typename: 'HttpHeader', name: 'Content-Type', value: 'video/mp4' },
					],
				},
			},
		},
	},
};
const completeUploadMock: MockedResponse = {
	request: { query: AdminVideosUploadContainerCompleteUploadDocument, variables: { input: { id: videoId } } },
	result: {
		data: {
			videoCompleteUpload: {
				__typename: 'VideoMutationResult',
				status: { __typename: 'MutationStatus', success: true, errorMessage: null },
				video: { __typename: 'Video', id: videoId, status: 'UPLOADED' },
			},
		},
	},
};

/** Records the storage PUT and answers with the given status, instead of touching the network. */
function fakeStorage(status: number) {
	const sent: { method: string; url: string; headers: Record<string, string>; body: unknown }[] = [];
	class FakeXMLHttpRequest {
		readonly upload: { onprogress: ((event: ProgressEvent) => void) | null } = { onprogress: null };
		onload: (() => void) | null = null;
		onerror: (() => void) | null = null;
		onabort: (() => void) | null = null;
		status = 0;
		private request = { method: '', url: '', headers: {} as Record<string, string> };
		open(method: string, url: string) {
			this.request = { method, url, headers: {} };
		}
		setRequestHeader(name: string, value: string) {
			this.request.headers[name] = value;
		}
		abort() {
			this.onabort?.();
		}
		send(body: unknown) {
			sent.push({ ...this.request, body });
			setTimeout(() => {
				this.upload.onprogress?.({ lengthComputable: true, loaded: 5, total: 10 } as ProgressEvent);
				this.status = status;
				this.onload?.();
			}, 10);
		}
	}
	return { sent, FakeXMLHttpRequest };
}

const meta: Meta<typeof VideosUploadContainer> = {
	title: 'Admin/Containers/VideosUploadContainer',
	component: VideosUploadContainer,
	args: { open: true, onClose: fn(), onUploaded: fn() },
};

export default meta;
type Story = StoryObj<typeof meta>;

const vtt = 'WEBVTT\n\n00:01.000 --> 00:03.000\nWelcome.\n';
const attachMock = (success: boolean): MockedResponse => ({
	request: { query: AdminVideosUploadContainerAttachCaptionDocument, variables: { input: { id: videoId, language: 'en', label: 'English', kind: 'CAPTIONS', content: vtt } } },
	result: {
		data: {
			videoAttachCaption: {
				__typename: 'VideoMutationResult',
				status: { __typename: 'MutationStatus', success, errorMessage: success ? null : 'The WebVTT file has no captions' },
			},
		},
	},
});

const chooseCaptions = async () => {
	const body = within(document.body);
	await userEvent.upload(document.body.querySelector('input[type="file"][accept=".vtt,.srt"]') as HTMLInputElement, new File([vtt], 'english.vtt', { type: 'text/vtt' }));
	await userEvent.click(await body.findByRole('combobox'));
	await userEvent.click(await body.findByTitle(/\(en\)$/));
	await waitFor(() => expect(body.getByLabelText('Name in the player')).toHaveValue('English'));
};

const chooseAndUpload = async (withCaptions = false) => {
	const body = within(document.body);
	await userEvent.upload(document.body.querySelector('input[type="file"]:not([accept=".vtt,.srt"])') as HTMLInputElement, file);
	if (withCaptions) {
		await chooseCaptions();
	}
	await waitFor(() => expect(body.getByLabelText('Title')).toHaveValue('Pool opening'));
	await userEvent.click(body.getByRole('button', { name: 'Upload' }));
};

const storage = fakeStorage(201);
export const UploadsDirectlyToStorage: Story = {
	decorators: [
		(Story) => (
			<MockedProvider mocks={[requestUploadMock, completeUploadMock]}>
				<App>
					<Story />
				</App>
			</MockedProvider>
		),
	],
	beforeEach: () => {
		const original = window.XMLHttpRequest;
		window.XMLHttpRequest = storage.FakeXMLHttpRequest as unknown as typeof XMLHttpRequest;
		return () => {
			window.XMLHttpRequest = original;
		};
	},
	play: async ({ args }) => {
		await chooseAndUpload();

		await waitFor(() => expect(args.onUploaded).toHaveBeenCalled());
		await expect(args.onClose).toHaveBeenCalled();
		await expect(storage.sent).toEqual([{ method: 'PUT', url: uploadUrl, headers: { 'x-ms-blob-type': 'BlockBlob', 'Content-Type': 'video/mp4' }, body: file }]);
		await expect(await within(document.body).findByText('"Pool opening" was uploaded. Staff will prepare it for streaming.')).toBeInTheDocument();
	},
};

const rejectingStorage = fakeStorage(403);
export const StorageRejectsTheUpload: Story = {
	decorators: UploadsDirectlyToStorage.decorators,
	beforeEach: () => {
		const original = window.XMLHttpRequest;
		window.XMLHttpRequest = rejectingStorage.FakeXMLHttpRequest as unknown as typeof XMLHttpRequest;
		return () => {
			window.XMLHttpRequest = original;
		};
	},
	play: async ({ args }) => {
		await chooseAndUpload();

		await expect(await within(document.body).findByText('The upload failed (HTTP 403). Try again.')).toBeInTheDocument();
		await expect(args.onUploaded).not.toHaveBeenCalled();
	},
};

export const ApiRefusesTheUpload: Story = {
	decorators: [
		(Story) => (
			<MockedProvider
				mocks={[
					{
						request: requestUploadMock.request,
						result: {
							data: {
								videoRequestUpload: {
									__typename: 'VideoRequestUploadMutationResult',
									status: { __typename: 'MutationStatus', success: false, errorMessage: 'You do not have permission to upload videos' },
									video: null,
									upload: null,
								},
							},
						},
					},
				]}
			>
				<App>
					<Story />
				</App>
			</MockedProvider>
		),
	],
	play: async () => {
		await chooseAndUpload();
		await expect(await within(document.body).findByText('You do not have permission to upload videos')).toBeInTheDocument();
	},
};

const withStorage = (mocks: MockedResponse[]): Pick<Story, 'decorators' | 'beforeEach'> => ({
	decorators: [
		(Story) => (
			<MockedProvider mocks={mocks}>
				<App>
					<Story />
				</App>
			</MockedProvider>
		),
	],
	beforeEach: () => {
		const original = window.XMLHttpRequest;
		window.XMLHttpRequest = fakeStorage(201).FakeXMLHttpRequest as unknown as typeof XMLHttpRequest;
		return () => {
			window.XMLHttpRequest = original;
		};
	},
});

export const UploadsWithCaptions: Story = {
	...withStorage([requestUploadMock, completeUploadMock, attachMock(true)]),
	play: async ({ args }) => {
		await chooseAndUpload(true);
		await waitFor(() => expect(args.onUploaded).toHaveBeenCalled());
		await expect(await within(document.body).findByText('"Pool opening" was uploaded with captions. Staff will prepare it for streaming.')).toBeInTheDocument();
	},
};

export const KeepsTheUploadWhenCaptionsFail: Story = {
	...withStorage([requestUploadMock, completeUploadMock, attachMock(false)]),
	play: async ({ args }) => {
		await chooseAndUpload(true);
		await waitFor(() => expect(args.onUploaded).toHaveBeenCalled());
		await expect(args.onClose).toHaveBeenCalled();
		await expect(await within(document.body).findByText('"Pool opening" was uploaded, but the captions could not be added: The WebVTT file has no captions. You can add them from the video\'s page.')).toBeInTheDocument();
	},
};
