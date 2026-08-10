// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemberProfileContainer } from './member-profile.container.tsx';

const { messageMock, useMutationMock, useQueryMock, useParamsMock } = vi.hoisted(() => ({
	messageMock: {
		success: vi.fn(),
		error: vi.fn(),
	},
	useMutationMock: vi.fn(() => [vi.fn(), { loading: false, error: undefined }]),
	useQueryMock: vi.fn(() => ({ data: undefined, loading: false, error: undefined })),
	useParamsMock: vi.fn(() => ({})),
}));

vi.mock('antd', () => ({
	App: {
		useApp: () => ({ message: messageMock }),
	},
}));

vi.mock('@apollo/client', () => ({
	useMutation: () => useMutationMock(),
	useQuery: () => useQueryMock(),
}));

vi.mock('react-router-dom', () => ({
	useParams: () => useParamsMock(),
}));

vi.mock('@cellix/ui-core', () => ({
	ComponentQueryLoader: ({ hasDataComponent }: { hasDataComponent?: React.ReactNode }) => <>{hasDataComponent}</>,
}));

vi.mock('./member-profile.tsx', () => ({
	MemberProfile: ({ onSave }: { onSave: (values: Record<string, unknown>) => Promise<boolean> }) => (
		<button type="button" onClick={() => {
			void onSave({ name: 'Jane' });
		}}>
			save
		</button>
	),
}));

describe('MemberProfileContainer', () => {
	let container: HTMLDivElement;
	let root: ReturnType<typeof createRoot>;

	beforeEach(() => {
		vi.clearAllMocks();
		useMutationMock.mockImplementation(() => [vi.fn(), { loading: false, error: undefined }]);
		useQueryMock.mockImplementation(() => ({ data: undefined, loading: false, error: undefined }));
		useParamsMock.mockImplementation(() => ({}));
		container = document.createElement('div');
		document.body.appendChild(container);
		root = createRoot(container);
	});

	afterEach(() => {
		act(() => {
			root.unmount();
		});
		container.remove();
	});

	async function clickSave() {
		await act(async () => {
			container.querySelector('button')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		});
	}

	it('reports success when a self profile save succeeds', async () => {
		useParamsMock.mockImplementation(() => ({ communityId: 'community-1' }));
		const selfMutation = vi.fn().mockResolvedValue({
			data: {
				memberUpdateMyProfile: {
					status: { success: true, errorMessage: undefined },
				},
			},
		});
		useMutationMock.mockImplementationOnce(() => [vi.fn(), { loading: false, error: undefined }])
			.mockImplementationOnce(() => [selfMutation, { loading: false, error: undefined }]);

		act(() => {
			root.render(<MemberProfileContainer mode="self" />);
		});
		await clickSave();

		expect(messageMock.success).toHaveBeenCalledWith('Profile updated');
	});

	it('reports an error when a self profile save returns a failure status', async () => {
		useParamsMock.mockImplementation(() => ({ communityId: 'community-1' }));
		const selfMutation = vi.fn().mockResolvedValue({
			data: {
				memberUpdateMyProfile: {
					status: { success: false, errorMessage: 'Self save failed' },
				},
			},
		});
		useMutationMock.mockImplementationOnce(() => [vi.fn(), { loading: false, error: undefined }])
			.mockImplementationOnce(() => [selfMutation, { loading: false, error: undefined }]);

		act(() => {
			root.render(<MemberProfileContainer mode="self" />);
		});
		await clickSave();

		expect(messageMock.error).toHaveBeenCalledWith('Self save failed');
	});

	it('reports when an admin save is attempted without a member id', async () => {
		useParamsMock.mockImplementation(() => ({ communityId: 'community-1' }));
		useMutationMock.mockImplementation(() => [vi.fn(), { loading: false, error: undefined }]);

		act(() => {
			root.render(<MemberProfileContainer mode="admin" />);
		});
		await clickSave();

		expect(messageMock.error).toHaveBeenCalledWith('Error updating profile: Cannot read properties of undefined (reading \'data\')');
	});

	it('reports a thrown save error for admin mode', async () => {
		useParamsMock.mockImplementation(() => ({ memberId: 'member-1' }));
		const profileMutation = vi.fn().mockRejectedValue(new Error('boom'));
		useMutationMock.mockImplementationOnce(() => [profileMutation, { loading: false, error: undefined }])
			.mockImplementationOnce(() => [vi.fn(), { loading: false, error: undefined }]);

		act(() => {
			root.render(<MemberProfileContainer mode="admin" />);
		});
		await clickSave();

		expect(messageMock.error).toHaveBeenCalledWith('Error updating profile: boom');
	});
});
