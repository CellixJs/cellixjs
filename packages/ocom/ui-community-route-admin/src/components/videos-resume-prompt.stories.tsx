import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { VideosResumePrompt } from './videos-resume-prompt.tsx';

const meta: Meta<typeof VideosResumePrompt> = {
	title: 'Admin/Components/VideosResumePrompt',
	component: VideosResumePrompt,
	tags: ['autodocs'],
	args: { resumeAt: 65, onResume: fn(), onStartOver: fn() },
	decorators: [
		(Story) => (
			<div style={{ position: 'relative', width: 640, aspectRatio: '16 / 9', background: '#000' }}>
				<Story />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Resume: Story = {
	play: async ({ canvasElement, args }) => {
		const prompt = within(canvasElement).getByRole('dialog', { name: 'You stopped at 1:05.' });
		await userEvent.click(within(prompt).getByRole('button', { name: 'Resume from 1:05' }));
		await expect(args.onResume).toHaveBeenCalled();
	},
};

export const StartOver: Story = {
	play: async ({ canvasElement, args }) => {
		await userEvent.click(within(canvasElement).getByRole('button', { name: 'Start over' }));
		await expect(args.onStartOver).toHaveBeenCalled();
	},
};
