import type { Meta, StoryObj } from '@storybook/react-vite';
import { LandingPage } from './landing-page.tsx';

const meta: Meta<typeof LandingPage> = {
	title: 'OwnerCommunity/Pages/LandingPage',
	component: LandingPage,
	tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof LandingPage>;

export const Default: Story = {};
