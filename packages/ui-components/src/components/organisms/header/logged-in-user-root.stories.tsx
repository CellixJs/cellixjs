import type { Meta, StoryObj } from '@storybook/react';
import type { LoggedInUserContainerEndUserFieldsFragment } from '../../../generated.tsx';
import { LoggedInUserRoot } from './logged-in-user-root.tsx';

const meta = {
	title: 'UI/Organisms/Header/LoggedInUserRoot/Display',
	component: LoggedInUserRoot,
	argTypes: {
		handleLogout: { action: 'handleLogout' },
	},
} satisfies Meta<typeof LoggedInUserRoot>;

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
		} as LoggedInUserContainerEndUserFieldsFragment,
	},
};
