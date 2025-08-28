import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within, fn } from 'storybook/test';
import { LoggedInUserCommunity, type LoggedInUserCommunityProps } from './logged-in-user-community.tsx';

const meta = {
    title: 'UI/Organisms/Header/LoggedInUserCommunity/Display',
    component: LoggedInUserCommunity,
        argTypes: {
            handleLogout: { action: 'handleLogout' },
        },
} satisfies Meta<typeof LoggedInUserCommunity>;

export default meta;
type Story = StoryObj<typeof LoggedInUserCommunity>;

export const Default: Story = {
    args: {
        data: {
            communityId: '65e2b5f8c9a1e2a7b4d3f2c1',
            userCurrent: {
                id: '65e2b5f8c9a1e2a7b4d3f2c2',
                personalInformation: {
                    identityDetails: {
                        restOfName: 'John',
                        lastName: 'Doe',
                    },
                },
            },
            memberForCurrentUser: {
                profile: {
                    avatarDocumentId: 'avatar-id',
                },
            },
        },
        handleLogout: fn(),
    },
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement as HTMLElement);
        const logoutBtn = await canvas.findByRole('button', { name: /log out/i });
        await userEvent.click(logoutBtn);
        expect(args.handleLogout).toHaveBeenCalledTimes(1);
    },
};

export const WithMissingAvatarAndName: Story = {
    args: {
        data: {
            communityId: '65e2b5f8c9a1e2a7b4d3f2c1',
        } as unknown as LoggedInUserCommunityProps['data'], // Partial data to test defaults
        handleLogout: fn(),
    },
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement as HTMLElement);
        const logoutBtn = await canvas.findByRole('button', { name: /log out/i });
        await userEvent.click(logoutBtn);
        expect(args.handleLogout).toHaveBeenCalledTimes(1);
    },
};
