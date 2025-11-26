import type React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within, fn } from 'storybook/test';
import type { ApolloClient } from '@apollo/client';
import type { AuthContextProps } from 'react-oidc-context';
import { HandleLogout } from './handle-logout.tsx';

type HarnessProps = {
  auth: Pick<AuthContextProps, 'removeUser' | 'signoutRedirect'>;
  client: Pick<ApolloClient<object>, 'clearStore'>;
  redirect?: string;
};

const LogoutTestHarness: React.FC<HarnessProps> = ({ auth, client, redirect }) => {
  return (
    // biome-ignore lint/plugin/no-type-assertion: test file
    <button type="button" onClick={() => HandleLogout(auth as AuthContextProps, client as ApolloClient<object>, redirect)}>
      Trigger Logout
    </button>
  );
};

const meta = {
  title: 'UI/Organisms/Header/Actions/HandleLogout',
  component: LogoutTestHarness,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof LogoutTestHarness>;

export default meta;
type Story = StoryObj<typeof LogoutTestHarness>;

export const NoRedirect: Story = {
  args: {
    auth: {
      removeUser: fn(),
      signoutRedirect: fn(),
    },
    client: {
      clearStore: fn(),
    },
  },
  render: (args) => <LogoutTestHarness {...args} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const btn = await canvas.findByRole('button', { name: /trigger logout/i });
    await userEvent.click(btn);

    expect(args.auth.removeUser).toHaveBeenCalledTimes(1);
    expect(args.client.clearStore).toHaveBeenCalledTimes(1);
    expect(args.auth.signoutRedirect).toHaveBeenCalledTimes(1);
    expect(args.auth.signoutRedirect).toHaveBeenCalledWith();
  },
};

export const WithRedirect: Story = {
  args: {
    auth: {
      removeUser: fn(),
      signoutRedirect: fn(),
    },
    client: {
      clearStore: fn(),
    },
    redirect: 'http://localhost:6006/after-logout',
  },
  render: (args) => <LogoutTestHarness {...args} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const btn = await canvas.findByRole('button', { name: /trigger logout/i });
    await userEvent.click(btn);

    expect(args.auth.removeUser).toHaveBeenCalledTimes(1);
    expect(args.client.clearStore).toHaveBeenCalledTimes(1);
    expect(args.auth.signoutRedirect).toHaveBeenCalledTimes(1);
    expect(args.auth.signoutRedirect).toHaveBeenCalledWith({ post_logout_redirect_uri: args.redirect });
  },
};
