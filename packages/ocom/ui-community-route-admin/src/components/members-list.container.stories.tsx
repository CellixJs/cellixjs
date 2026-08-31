import { InMemoryCache } from '@apollo/client';
import { MockedProvider } from '@apollo/client/testing';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { App } from 'antd';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { AdminMemberListContainerBulkRemoveMembersDocument, AdminMemberListContainerMembersDocument, AdminMemberListContainerRemoveMemberDocument, AdminPropertiesOwnerOptionsDocument } from '../generated.tsx';
import { MemberListContainer } from './members-list.container.tsx';

const communityId = 'community-1';
const currentMemberId = 'member-current';
const removableMemberId = 'member-removable';
const secondRemovableMemberId = 'member-removable-2';

const member = (id: string, memberName: string) => ({
	__typename: 'Member' as const,
	id,
	memberName,
	isAdmin: false,
	accounts: [
		{
			__typename: 'MemberAccount' as const,
			id: `${id}-account`,
			firstName: memberName,
			lastName: 'Member',
			statusCode: 'ACCEPTED',
			user: null,
			createdAt: '2026-01-01T00:00:00.000Z',
			updatedAt: '2026-01-01T00:00:00.000Z',
		},
	],
	profile: null,
	createdAt: '2026-01-01T00:00:00.000Z',
	updatedAt: '2026-01-01T00:00:00.000Z',
});

const ownerOptions = {
	propertyOwnerOptions: [{ __typename: 'PropertyOwnerOption' as const, id: removableMemberId, memberName: 'Removable Member' }],
};

const createCache = () => {
	const cache = new InMemoryCache();
	cache.writeQuery({
		query: AdminPropertiesOwnerOptionsDocument,
		variables: { communityId },
		data: ownerOptions,
	});
	return cache;
};

const membersQueryMock = {
	request: {
		query: AdminMemberListContainerMembersDocument,
		variables: { communityId },
	},
	result: {
		data: {
			membersByCommunityId: [member(currentMemberId, 'Current'), member(removableMemberId, 'Removable'), member(secondRemovableMemberId, 'Second')],
			memberForCurrentCommunity: { __typename: 'Member' as const, id: currentMemberId },
		},
	},
};

const renderContainer = (cache: InMemoryCache, mocks: Parameters<typeof MockedProvider>[0]['mocks']) => (StoryComponent: React.ComponentType) => (
	<MockedProvider
		cache={cache}
		mocks={mocks}
	>
		<App>
			<MemoryRouter initialEntries={[`/community/${communityId}/admin/${currentMemberId}/members`]}>
				<Routes>
					<Route
						path="/community/:communityId/admin/:memberId/members"
						element={<StoryComponent />}
					/>
				</Routes>
			</MemoryRouter>
		</App>
	</MockedProvider>
);

const meta = {
	title: 'Components/Layouts/Admin/MemberListContainer',
	component: MemberListContainer,
} satisfies Meta<typeof MemberListContainer>;

export default meta;
type Story = StoryObj<typeof MemberListContainer>;

const singleRemoveCache = createCache();

export const SuccessfulRemoveEvictsOwnerOptions: Story = {
	decorators: [
		renderContainer(singleRemoveCache, [
			membersQueryMock,
			{
				request: {
					query: AdminMemberListContainerRemoveMemberDocument,
					variables: { input: { memberId: removableMemberId, reason: 'Removed from member list' } },
				},
				result: {
					data: {
						removeMember: {
							__typename: 'MemberMutationResult',
							status: { __typename: 'MutationStatus', success: true, errorMessage: null },
							member: null,
						},
					},
				},
			},
		]),
	],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await canvas.findByText('Removable');
		const removeButton = canvas.getAllByRole('button', { name: /^remove$/i }).find((button) => !button.hasAttribute('disabled'));
		expect(removeButton).toBeDefined();
		await userEvent.click(removeButton as HTMLElement);

		await waitFor(() =>
			expect(
				singleRemoveCache.readQuery({
					query: AdminPropertiesOwnerOptionsDocument,
					variables: { communityId },
				}),
			).toBeNull(),
		);
	},
};

const bulkRemoveCache = createCache();

export const SuccessfulBulkRemoveEvictsOwnerOptions: Story = {
	decorators: [
		renderContainer(bulkRemoveCache, [
			membersQueryMock,
			{
				request: {
					query: AdminMemberListContainerBulkRemoveMembersDocument,
					variables: {
						input: {
							memberIds: [removableMemberId, secondRemovableMemberId],
							communityId,
						},
					},
				},
				result: {
					data: {
						bulkRemoveMembers: {
							__typename: 'BulkMemberMutationResult',
							status: { __typename: 'MutationStatus', success: true, errorMessage: null },
							members: [],
							successCount: 2,
							failedCount: 0,
						},
					},
				},
			},
		]),
	],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await canvas.findByText('Removable');
		await userEvent.click(canvas.getAllByRole('checkbox')[0] as HTMLElement);
		await userEvent.click(canvas.getByRole('button', { name: /remove selected/i }));

		const body = within(canvasElement.ownerDocument.body);
		await body.findByText('Remove selected members?');
		await userEvent.click(body.getByRole('button', { name: /remove members/i }));

		await waitFor(() =>
			expect(
				bulkRemoveCache.readQuery({
					query: AdminPropertiesOwnerOptionsDocument,
					variables: { communityId },
				}),
			).toBeNull(),
		);
	},
};
