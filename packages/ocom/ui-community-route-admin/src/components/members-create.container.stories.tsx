import { InMemoryCache } from '@apollo/client';
import { MockedProvider } from '@apollo/client/testing';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { App } from 'antd';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { AdminMemberListContainerMembersDocument, AdminMembersCreateContainerMemberCreateDocument, AdminPropertiesOwnerOptionsDocument } from '../generated.tsx';
import { MembersCreateContainer } from './members-create.container.tsx';

const communityId = 'community-1';
const otherCommunityId = 'community-2';
const ownerOptions = (id: string, memberName: string) => ({
	propertyOwnerOptions: [{ __typename: 'PropertyOwnerOption' as const, id, memberName }],
});

const cache = new InMemoryCache();
cache.writeQuery({
	query: AdminPropertiesOwnerOptionsDocument,
	variables: { communityId },
	data: ownerOptions('member-old', 'Old Owner'),
});
cache.writeQuery({
	query: AdminPropertiesOwnerOptionsDocument,
	variables: { communityId: otherCommunityId },
	data: ownerOptions('member-other', 'Other Owner'),
});

const meta = {
	title: 'Components/Layouts/Admin/MembersCreateContainer',
	component: MembersCreateContainer,
} satisfies Meta<typeof MembersCreateContainer>;

export default meta;
type Story = StoryObj<typeof MembersCreateContainer>;

export const SuccessfulCreateEvictsOwnerOptions: Story = {
	args: {
		data: { communityId },
	},
	decorators: [
		(StoryComponent) => (
			<MockedProvider
				cache={cache}
				mocks={[
					{
						request: {
							query: AdminMembersCreateContainerMemberCreateDocument,
							variables: { input: { memberName: 'New Owner', communityId } },
						},
						result: {
							data: {
								memberCreate: {
									__typename: 'MemberMutationResult',
									status: { __typename: 'MutationStatus', success: true, errorMessage: null },
									member: {
										__typename: 'Member',
										id: 'member-new',
										memberName: 'New Owner',
										createdAt: '2026-01-01T00:00:00.000Z',
										updatedAt: '2026-01-01T00:00:00.000Z',
									},
								},
							},
						},
					},
					{
						request: {
							query: AdminMemberListContainerMembersDocument,
							variables: { communityId },
						},
						result: {
							data: {
								membersByCommunityId: [],
								memberForCurrentCommunity: null,
							},
						},
					},
				]}
			>
				<App>
					<MemoryRouter initialEntries={[`/community/${communityId}/admin/member-current/members/create`]}>
						<Routes>
							<Route
								path="/community/:communityId/admin/:memberId/members/create"
								element={<StoryComponent />}
							/>
							<Route
								path="*"
								element={<div>Member Detail Route</div>}
							/>
						</Routes>
					</MemoryRouter>
				</App>
			</MockedProvider>
		),
	],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.type(canvas.getByLabelText('Member Name'), 'New Owner');
		await userEvent.click(canvas.getByRole('button', { name: /create member/i }));
		expect(await canvas.findByText('Member Detail Route')).toBeInTheDocument();

		await waitFor(() =>
			expect(
				cache.readQuery({
					query: AdminPropertiesOwnerOptionsDocument,
					variables: { communityId },
				}),
			).toBeNull(),
		);
		expect(
			cache.readQuery({
				query: AdminPropertiesOwnerOptionsDocument,
				variables: { communityId: otherCommunityId },
			}),
		).toEqual(ownerOptions('member-other', 'Other Owner'));
	},
};
