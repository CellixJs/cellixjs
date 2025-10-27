import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import { UserInfo, type UserInfoProps} from './user-info.tsx';

const meta = {
  title: 'Components/Accounts/UserInfo',
  component: UserInfo,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof UserInfo>;

export default meta;
type Story = StoryObj<typeof UserInfo>;

const mockUserData = {
  id: 'user-123',
  __typename: 'EndUser' as const,
};

export const Default: Story = {
  args: {
    userData: mockUserData,
  } satisfies UserInfoProps,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify the user ID is displayed
    const userIdText = await canvas.findByTestId('user-id');
    expect(userIdText).toHaveTextContent('User ID: user-123');
  },
};

export const DifferentUser: Story = {
  args: {
    userData: {
      id: 'user-456',
      __typename: 'EndUser' as const,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify the different user ID is displayed
    const userIdText = await canvas.findByTestId('user-id');
    expect(userIdText).toHaveTextContent('User ID: user-456');
  },
};