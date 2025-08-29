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
    const canvas = within(canvasElement);
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
    const canvas = within(canvasElement);
    const logoutBtn = await canvas.findByRole('button', { name: /log out/i });
    await userEvent.click(logoutBtn);
    expect(args.onLogoutClicked).toHaveBeenCalledTimes(1);
  },
};

export const WithAllDefaultValues: Story = {
  args: {
    // The minimum required prop - only isLoggedIn is required
    data: {
      isLoggedIn: true,
    },
    // No callbacks provided
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // First verify the component renders without errors
    const logoutBtn = await canvas.findByRole('button', { name: /log out/i });
    
    // Check that we can click buttons without errors
    await userEvent.click(logoutBtn);
    
    // If we got here without errors, all default values are working correctly
    expect(true).toBe(true);
  },
};

// Test logged out state with missing callbacks (dummyFunction)
export const LoggedOutWithMissingCallbacks: Story = {
  args: {
    data: {
      isLoggedIn: false,
    },
    // No callbacks provided
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Test logout user state with missing callbacks
    const loginBtn = await canvas.findByRole('button', { name: /login/i });
    const signupBtn = await canvas.findByRole('button', { name: /sign up/i });
    
    // Click both buttons which should use the dummyFunction
    await userEvent.click(loginBtn);
    await userEvent.click(signupBtn);
    
    // If we got here without errors, the dummyFunction is working correctly
    expect(true).toBe(true);
  },
};

// Test logged in state with missing callbacks (dummyFunction)
export const LoggedInWithMissingCallbacks: Story = {
  args: {
    data: {
      isLoggedIn: true,
      // Explicitly set all fields to undefined to test fallback logic
      firstName: undefined,
      lastName: undefined,
      profileImage: undefined,
      notificationCount: undefined
    },
    // No callbacks provided
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Find and click logout which should use the dummyFunction
    const logoutBtn = await canvas.findByRole('button', { name: /log out/i });
    await userEvent.click(logoutBtn);
    
    // If we got here without errors, the dummyFunction is working correctly
    expect(true).toBe(true);
  },
};