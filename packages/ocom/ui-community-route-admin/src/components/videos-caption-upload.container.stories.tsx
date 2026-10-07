import type { MockedResponse } from '@apollo/client/testing';
import { MockedProvider } from '@apollo/client/testing';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { App } from 'antd';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { AdminVideosCaptionUploadContainerAttachCaptionDocument } from '../generated.tsx';
import { VideosCaptionUploadContainer } from './videos-caption-upload.container.tsx';

const videoId = '6ac40e30cbfbc8b59ab74e81';
const vtt = 'WEBVTT\n\n00:01.000 --> 00:03.000\nWelcome.\n';
const attachMock = (success: boolean): MockedResponse => ({
	request: { query: AdminVideosCaptionUploadContainerAttachCaptionDocument, variables: { input: { id: videoId, language: 'en', label: 'English', kind: 'CAPTIONS', content: vtt } } },
	result: {
		data: {
			videoAttachCaption: {
				__typename: 'VideoMutationResult',
				status: { __typename: 'MutationStatus', success, errorMessage: success ? null : 'The WebVTT file has no captions' },
				video: success ? { __typename: 'Video', id: videoId, captionTracks: [{ __typename: 'VideoCaptionTrack', language: 'en', label: 'English', kind: 'CAPTIONS' }] } : null,
			},
		},
	},
});

const withMocks = (mocks: MockedResponse[]): NonNullable<Meta<typeof VideosCaptionUploadContainer>['decorators']> => [
	(Story) => (
		<MockedProvider mocks={mocks}>
			<App>
				<Story />
			</App>
		</MockedProvider>
	),
];

const meta: Meta<typeof VideosCaptionUploadContainer> = {
	title: 'Admin/Containers/VideosCaptionUploadContainer',
	component: VideosCaptionUploadContainer,
	args: { videoId, open: true, existingLanguages: [], onClose: fn(), onAttached: fn() },
};

export default meta;
type Story = StoryObj<typeof meta>;

const addEnglishCaptions = async () => {
	const body = within(document.body);
	await userEvent.upload(document.body.querySelector('input[type="file"]') as HTMLInputElement, new File([vtt], 'english.vtt', { type: 'text/vtt' }));
	await body.findByText('english.vtt');
	await userEvent.click(body.getByRole('combobox'));
	await userEvent.click(await body.findByTitle(/\(en\)$/));
	await waitFor(() => expect(body.getByLabelText('Name in the player')).toHaveValue('English'));
	await userEvent.click(body.getByRole('button', { name: 'Add' }));
};

export const AttachesCaptions: Story = {
	decorators: withMocks([attachMock(true)]),
	play: async ({ args }) => {
		await addEnglishCaptions();
		await waitFor(() => expect(args.onAttached).toHaveBeenCalled());
		await expect(args.onClose).toHaveBeenCalled();
		await expect(await within(document.body).findByText('English captions were added.')).toBeInTheDocument();
	},
};

export const ShowsWhyCaptionsWereRejected: Story = {
	decorators: withMocks([attachMock(false)]),
	play: async ({ args }) => {
		await addEnglishCaptions();
		await expect(await within(document.body).findByText('The WebVTT file has no captions')).toBeInTheDocument();
		await expect(args.onAttached).not.toHaveBeenCalled();
	},
};
