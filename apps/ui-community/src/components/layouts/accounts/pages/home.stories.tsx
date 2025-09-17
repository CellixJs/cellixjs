import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import { MemoryRouter } from 'react-router-dom';
import { Accounts } from '../index.tsx';

const meta = {
  title: 'Pages/Accounts/Home',
  component: Accounts,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Accounts>;

export default meta;
type Story = StoryObj<typeof Accounts>;

export const Default: Story = {
  args: {},
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/']}>
        <Story />
      </MemoryRouter>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify the welcome title is present
    const welcomeTitle = await canvas.findByText('Welcome to Owner Community');
    expect(welcomeTitle).toBeInTheDocument();

    // Verify the description text is present
    const descriptionText = await canvas.findByText(/To join a community, you must provide/);
    expect(descriptionText).toBeInTheDocument();
  },
};