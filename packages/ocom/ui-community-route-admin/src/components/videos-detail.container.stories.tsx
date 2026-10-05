import type { MockedResponse } from '@apollo/client/testing';
import { MockedProvider } from '@apollo/client/testing';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, within } from 'storybook/test';
import { AdminVideosDetailContainerPlaybackDocument, AdminVideosDetailContainerVideoDocument } from '../generated.tsx';
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
};
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
				sasToken: 'sv=2021-04-10&sr=c&sp=r',
				expiresAt: '2026-10-05T14:00:00.000Z',
			},
		},
	},
};

const render = (mocks: MockedResponse[]): Meta<typeof VideosDetailContainer>['decorators'] => [
	(Story) => (
		<MockedProvider mocks={mocks}>
			<MemoryRouter initialEntries={[`/videos/${id}`]}>
				<Routes>
					<Route
						path="/videos/:videoId"
						element={<Story />}
					/>
				</Routes>
			</MemoryRouter>
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
