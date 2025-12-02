import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within, fn } from 'storybook/test';
import type { LoggedInUserContainerEndUserFieldsFragment } from '../../../generated.tsx';
import { LoggedInUserRoot, type LoggedInUserRootProps } from './logged-in-user-root.tsx';

const meta = {
	title: 'UI/Organisms/Header/LoggedInUserRoot/Display',
	component: LoggedInUserRoot,
	argTypes: {
		handleLogout: { action: 'handleLogout' },
	},
} satisfies Meta<typeof LoggedInUserRoot & LoggedInUserRootProps>;

export default meta;
type Story = StoryObj<typeof LoggedInUserRoot>;

export const Default: Story = {
	args: {
		userData: {
			id: 'user-1',
			personalInformation: {
				identityDetails: {
					restOfName: 'Jane',
					lastName: 'Smith',
					__typename: 'EndUserIdentityDetails',
				},
				__typename: 'EndUserPersonalInformation',
			},
			__typename: 'EndUser',
		// biome-ignore lint/plugin/no-type-assertion: test file
		} as LoggedInUserContainerEndUserFieldsFragment,
        handleLogout: fn(),
	},
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        const logoutBtn = await canvas.findByRole('button', { name: /log out/i });
        await userEvent.click(logoutBtn);
        expect(args.handleLogout).toHaveBeenCalledTimes(1);
    },
};

export const WithMissingName: Story = {
	args: {
		userData: {
			id: 'user-1',
			personalInformation: {
				identityDetails: {
					restOfName: '',
					lastName: '',
					__typename: 'EndUserIdentityDetails',
				},
				__typename: 'EndUserPersonalInformation',
			},
			__typename: 'EndUser',
		// biome-ignore lint/plugin/no-type-assertion: test file
		} as LoggedInUserContainerEndUserFieldsFragment,
        handleLogout: fn(),
	},
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        const logoutBtn = await canvas.findByRole('button', { name: /log out/i });
        await userEvent.click(logoutBtn);
        expect(args.handleLogout).toHaveBeenCalledTimes(1);
    },
};

export const WithNullPersonalInfo: Story = {
	args: {
		userData: {
			id: 'user-1',
			personalInformation: null,
			__typename: 'EndUser',
		// biome-ignore lint/plugin/no-type-assertion: test file
		} as unknown as LoggedInUserContainerEndUserFieldsFragment,
        handleLogout: fn(),
	},
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        const logoutBtn = await canvas.findByRole('button', { name: /log out/i });
        await userEvent.click(logoutBtn);
        expect(args.handleLogout).toHaveBeenCalledTimes(1);
    },
};
