import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within, fn } from 'storybook/test';
import { LoggedInUser } from './index.tsx';

const meta = {
  title: 'UI/Molecules/LoggedInUser',
  component: LoggedInUser,
  argTypes: {
    onLoginClicked: { action: 'onLoginClicked' },
    onSignupClicked: { action: 'onSignupClicked' },
    onLogoutClicked: { action: 'onLogoutClicked' },
  },
} satisfies Meta<typeof LoggedInUser>;

export default meta;
type Story = StoryObj<typeof LoggedInUser>;

export const LoggedOut: Story = {
  args: {
    data: {
      isLoggedIn: false,
    },
    onLoginClicked: fn(),
    onSignupClicked: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement as HTMLElement);
    const loginBtn = await canvas.findByRole('button', { name: /login/i });
    const signupBtn = await canvas.findByRole('button', { name: /sign up/i });
    await userEvent.click(loginBtn);
    await userEvent.click(signupBtn);
    expect(args.onLoginClicked).toHaveBeenCalledTimes(1);
    expect(args.onSignupClicked).toHaveBeenCalledTimes(1);
  },
};

export const LoggedIn: Story = {
  args: {
    data: {
      isLoggedIn: true,
      firstName: 'John',
      lastName: 'Doe',
      notificationCount: 0,
    },
    onLogoutClicked: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement as HTMLElement);
    const logoutBtn = await canvas.findByRole('button', { name: /log out/i });
    await userEvent.click(logoutBtn);
    expect(args.onLogoutClicked).toHaveBeenCalledTimes(1);
  },
};