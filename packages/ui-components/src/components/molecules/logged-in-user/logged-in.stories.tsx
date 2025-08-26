import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, userEvent, fn } from 'storybook/test';
import { LoggedIn } from './logged-in.tsx';

const meta = {
  title: 'UI/Molecules/LoggedInUser/LoggedIn',
  component: LoggedIn,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    onLogoutClicked: { action: 'onLogoutClicked' },
  },
} satisfies Meta<typeof LoggedIn>;

export default meta;
export type Story = StoryObj<typeof LoggedIn>;

export const WithoutProfileImage: Story = {
  args: {
    data: {
      firstName: 'John',
      lastName: 'Doe',
      notificationCount: 3,
    },
    onLogoutClicked: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement as HTMLElement);
    // Assert full name, logout button, and My Community(s) link are present
    await canvas.findByText(/john\s+doe/i);
    const logoutButton = await canvas.findByRole('button', { name: /log out/i });
    const link = await canvas.findByRole('link', { name: /my community\(s\)/i });
    expect(logoutButton).toBeInTheDocument();
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/community/accounts');

    // Click and assert handler invoked
    await userEvent.click(logoutButton);
    expect(args.onLogoutClicked).toHaveBeenCalledTimes(1);

    // AntD Image renders an <img/>; assert fallback avatar URL based on initials
    const images = canvas.getAllByRole('img');
    const expectedSrc = `https://ui-avatars.com/api/?name=${args.data.firstName}+${args.data.lastName}`;
    const hasFallback = images.some((img) => img.getAttribute('src') === expectedSrc);
    expect(hasFallback).toBe(true);
  },
};

export const WithProfileImage: Story = {
  args: {
    data: {
      firstName: 'Jane',
      lastName: 'Smith',
      notificationCount: 5,
      // inline data URL to avoid external network calls
      profileImage:
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="100%" height="100%" fill="%23d1e7dd"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="48" fill="%230a3622">JS</text></svg>',
    },
    onLogoutClicked: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement as HTMLElement);
    // Assert name is present and there is at least one image rendered
    await canvas.findByText(/jane\s+smith/i);
  const images = canvas.getAllByRole('img');
  const hasProvided = images.some((img) => img.getAttribute('src') === args.data.profileImage);
  expect(hasProvided).toBe(true);
    // Click and assert handler invoked
    const logoutButton = await canvas.findByRole('button', { name: /log out/i });
    await userEvent.click(logoutButton);
    expect(args.onLogoutClicked).toHaveBeenCalledTimes(1);
  },
};
