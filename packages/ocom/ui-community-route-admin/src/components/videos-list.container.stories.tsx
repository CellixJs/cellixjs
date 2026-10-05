import { MockedProvider } from '@apollo/client/testing';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { App } from 'antd';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, userEvent, within } from 'storybook/test';
import { AdminVideosListContainerCommunityVideosDocument } from '../generated.tsx';
import { VideosListContainer } from './videos-list.container.tsx';

const videos = [
	{
		__typename: 'Video',
		id: '6ac40e30cbfbc8b59ab74e81',
		title: 'Annual meeting',
		status: 'READY',
		sourceSizeBytes: 1_048_576,
		durationSeconds: 5,
		renditionHeights: [720, 480, 360],
		failureMessage: null,
		createdAt: '2026-10-04T12:00:00.000Z',
	},
];

const meta: Meta<typeof VideosListContainer> = {
	title: 'Admin/Containers/VideosListContainer',
	component: VideosListContainer,
	decorators: [
		(Story) => (
			<MockedProvider mocks={[{ request: { query: AdminVideosListContainerCommunityVideosDocument }, result: { data: { communityVideos: videos } } }]}>
				<App>
					<MemoryRouter initialEntries={['/videos']}>
						<Routes>
							<Route
								path="/videos"
								element={<Story />}
							/>
							<Route
								path="/videos/:videoId"
								element={<div>Watching video</div>}
							/>
						</Routes>
					</MemoryRouter>
				</App>
			</MockedProvider>
		),
	],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const LoadsAndOpensVideos: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(await canvas.findByText('Annual meeting')).toBeInTheDocument();

		await userEvent.click(canvas.getByRole('button', { name: /Upload Video/ }));
		await expect(await within(document.body).findByRole('dialog')).toBeInTheDocument();
		await userEvent.click(within(document.body).getByRole('button', { name: /Cancel/ }));

		await userEvent.click(canvas.getByRole('button', { name: 'Watch' }));
		await expect(await canvas.findByText('Watching video')).toBeInTheDocument();
	},
};
