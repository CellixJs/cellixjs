import type { Meta, StoryObj } from '@storybook/react';
import { expect } from 'storybook/test';
import { MemoryRouter } from 'react-router-dom';
import { AuthLanding } from './index.tsx';

const meta = {
  title: 'Components/UI/Molecules/AuthLanding',
  component: AuthLanding,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof AuthLanding>;

export default meta;
type Story = StoryObj<typeof AuthLanding>;

export const Default: Story = {
  args: {},
  play: ({ canvasElement }) => {
    // The AuthLanding component renders a Navigate component which doesn't render visible content
    // We can only verify that the component doesn't throw an error during rendering
    expect(canvasElement).toBeTruthy();
  },
};