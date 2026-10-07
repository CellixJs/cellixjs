import type { MockedResponse } from '@apollo/client/testing';
import { MockedProvider } from '@apollo/client/testing';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { App } from 'antd';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, userEvent, within } from 'storybook/test';
import { AdminVideosDetailContainerPlaybackDocument, AdminVideosDetailContainerRemoveCaptionDocument, AdminVideosDetailContainerVideoDocument } from '../generated.tsx';
import { VideosDetailContainer } from './videos-detail.container.tsx';

const id = '6ac40e30cbfbc8b59ab74e81';
const video = {
	__typename: 'Video',
	id,
	title: 'Annual meeting',
	status: 'READY',
	durationSeconds: 5,
	renditionHeights: [720, 480, 360],
	failureMessage: null,
	createdAt: '2026-10-04T12:00:00.000Z',
	captionTracks: [] as { __typename: string; language: string; label: string; kind: string }[],
};
const englishCaptions = { __typename: 'VideoCaptionTrack', language: 'en', label: 'English', kind: 'CAPTIONS' };
const videoMock = (overrides: Record<string, unknown> = {}): MockedResponse => ({
	request: { query: AdminVideosDetailContainerVideoDocument, variables: { id } },
	result: { data: { videoById: { ...video, ...overrides } } },
});
const playbackMock: MockedResponse = {
	request: { query: AdminVideosDetailContainerPlaybackDocument, variables: { id } },
	result: {
		data: {
			videoPlayback: {
				__typename: 'VideoPlayback',
				hlsManifestUrl: `https://storage.example/videos-c1/${id}/master.m3u8`,
				dashManifestUrl: `https://storage.example/videos-c1/${id}/manifest.mpd`,
				captionTracks: [],
				sasToken: 'sv=2021-04-10&sr=c&sp=r',
				expiresAt: '2026-10-05T14:00:00.000Z',
			},
		},
	},
};

const render = (mocks: MockedResponse[]): Meta<typeof VideosDetailContainer>['decorators'] => [
	(Story) => (
		<MockedProvider mocks={mocks}>
			<App>
				<MemoryRouter initialEntries={[`/videos/${id}`]}>
					<Routes>
						<Route
							path="/videos/:videoId"
							element={<Story />}
						/>
					</Routes>
				</MemoryRouter>
			</App>
		</MockedProvider>
	),
];

const meta: Meta<typeof VideosDetailContainer> = {
	title: 'Admin/Containers/VideosDetailContainer',
	component: VideosDetailContainer,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ReadyWithPlayback: Story = {
	decorators: render([videoMock(), playbackMock]),
	play: async ({ canvasElement }) => {
		await expect(await within(canvasElement).findByRole('heading', { name: 'Annual meeting' })).toBeInTheDocument();
		await expect(await within(canvasElement).findByTitle('Annual meeting')).toBeInTheDocument();
	},
};

export const NotReadySkipsPlayback: Story = {
	// No playback mock: requesting it would fail the story with an unmatched-mock error.
	decorators: render([videoMock({ status: 'UPLOADED', durationSeconds: null, renditionHeights: [] })]),
	play: async ({ canvasElement }) => {
		await expect(await within(canvasElement).findByText('Uploaded. Staff will prepare it for streaming.')).toBeInTheDocument();
	},
};

export const PlaybackFails: Story = {
	decorators: render([videoMock(), { request: playbackMock.request, error: new Error('Network error') }]),
	play: async ({ canvasElement }) => {
		await expect(await within(canvasElement).findByText('The video could not be loaded for playback. Refresh the page to try again.')).toBeInTheDocument();
	},
};

export const NotFound: Story = {
	decorators: render([{ request: { query: AdminVideosDetailContainerVideoDocument, variables: { id } }, result: { data: { videoById: null } } }]),
	play: async ({ canvasElement }) => {
		await expect(await within(canvasElement).findByText('Video not found.')).toBeInTheDocument();
	},
};

const removeMock = (success: boolean): MockedResponse => ({
	request: { query: AdminVideosDetailContainerRemoveCaptionDocument, variables: { input: { id, language: 'en' } } },
	result: {
		data: {
			videoRemoveCaption: {
				__typename: 'VideoMutationResult',
				status: { __typename: 'MutationStatus', success, errorMessage: success ? null : 'You do not have permission to manage captions' },
				video: success ? { ...video, status: 'UPLOADED', durationSeconds: null, renditionHeights: [], captionTracks: [] } : null,
			},
		},
	},
});

const removeCaptions = async (canvasElement: HTMLElement) => {
	const canvas = within(canvasElement);
	await userEvent.click(await canvas.findByRole('button', { name: 'Remove' }));
	const body = within(document.body);
	await userEvent.click((await body.findAllByRole('button', { name: 'Remove' })).at(-1) as HTMLElement);
};

export const RemovesCaptions: Story = {
	decorators: render([videoMock({ status: 'UPLOADED', durationSeconds: null, renditionHeights: [], captionTracks: [englishCaptions] }), removeMock(true)]),
	play: async ({ canvasElement }) => {
		await removeCaptions(canvasElement);
		await expect(await within(document.body).findByText('Captions removed.')).toBeInTheDocument();
		await expect(await within(canvasElement).findByText(/No captions yet\./)).toBeInTheDocument();
	},
};

export const ReportsWhenRemovingFails: Story = {
	decorators: render([videoMock({ status: 'UPLOADED', durationSeconds: null, renditionHeights: [], captionTracks: [englishCaptions] }), removeMock(false)]),
	play: async ({ canvasElement }) => {
		await removeCaptions(canvasElement);
		await expect(await within(document.body).findByText('You do not have permission to manage captions')).toBeInTheDocument();
	},
};

export const OpensTheCaptionDialog: Story = {
	decorators: render([videoMock({ status: 'UPLOADED', durationSeconds: null, renditionHeights: [] })]),
	play: async ({ canvasElement }) => {
		await userEvent.click(await within(canvasElement).findByRole('button', { name: /Add Captions/ }));
		await expect(await within(document.body).findByRole('dialog', { name: 'Add Captions' })).toBeInTheDocument();
	},
};
