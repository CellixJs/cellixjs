import type { Meta, StoryObj } from '@storybook/react';
import { LoggedInUserCommunity } from './logged-in-user-community.tsx';

const meta = {
    title: 'UI/Organisms/Header/LoggedInUserCommunity',
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
    },
};
