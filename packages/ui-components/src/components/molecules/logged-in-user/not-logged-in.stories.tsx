import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within, fn } from 'storybook/test';
import { NotLoggedIn } from './not-logged-in.tsx';

const meta = {
  title: 'UI/Molecules/LoggedInUser/NotLoggedIn',
  component: NotLoggedIn,
} satisfies Meta<typeof NotLoggedIn>;

export default meta;

type Story = StoryObj<typeof NotLoggedIn>;

export const Default: Story = {
  args: {
    onLoginClicked: fn(),
    onSignupClicked: fn(),
  },
  play: async ({ canvasElement, args }) => {
  const canvas = within(canvasElement);
  const loginBtn = await canvas.findByRole('button', { name: /login/i });
  const signupBtn = await canvas.findByRole('button', { name: /sign up/i });
  await userEvent.click(loginBtn);
  await userEvent.click(signupBtn);
    expect(args.onLoginClicked).toHaveBeenCalledTimes(1);
    expect(args.onSignupClicked).toHaveBeenCalledTimes(1);
  },
};
