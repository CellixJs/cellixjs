import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Domain } from '@ocom/domain';
import { createMember, type MemberCreateCommand } from './member-management.js';

// Define proper mock interface types
interface MockRepository {
	getNewInstance: ReturnType<typeof vi.fn>;
	save: ReturnType<typeof vi.fn>;
	getByCommunityId: ReturnType<typeof vi.fn>;
}

interface MockDataSources {
	readonlyDataSource: {
		Community: {
			Member: {
				MemberReadRepo: {
					memberNameExistsInCommunity: ReturnType<typeof vi.fn>;
				};
			};
		};
	};
	domainDataSource: {
		Community: {
			Member: {
				MemberUnitOfWork: {
					withScopedTransaction: ReturnType<typeof vi.fn>;
				};
			};
			Role: {
				EndUserRole: {
					EndUserRoleUnitOfWork: {
						withScopedTransaction: ReturnType<typeof vi.fn>;
					};
				};
			};
		};
	};
}

interface MockMember {
	id: string;
	memberName: string;
	communityId: string;
	role: unknown;
}

describe('createMember', () => {
	let mockDataSources: MockDataSources;
	let mockMemberRepository: MockRepository;
	let mockRoleRepository: MockRepository;

	beforeEach(() => {
		mockMemberRepository = {
			getNewInstance: vi.fn(),
			save: vi.fn(),
			getByCommunityId: vi.fn(),
		};

		mockRoleRepository = {
			getByCommunityId: vi.fn(),
			getNewInstance: vi.fn(),
			save: vi.fn(),
		};

		mockDataSources = {
			readonlyDataSource: {
				Community: {
					Member: {
						MemberReadRepo: {
							memberNameExistsInCommunity: vi.fn().mockResolvedValue(false),
						},
					},
				},
			},
			domainDataSource: {
				Community: {
					Member: {
						MemberUnitOfWork: {
							withScopedTransaction: vi.fn(async (callback) => {
								await callback(mockMemberRepository);
							}),
						},
					},
					Role: {
						EndUserRole: {
							EndUserRoleUnitOfWork: {
								withScopedTransaction: vi.fn(async (callback) => {
									await callback(mockRoleRepository);
								}),
							},
						},
					},
				},
			},
		};
	});

	it('should successfully create a member with default role', async () => {
		// Arrange
		const command: MemberCreateCommand = {
			memberName: 'Test User',
			communityId: 'community-123',
		};

		const mockDefaultRole = {
			id: 'role-123',
			roleName: 'Default Member',
			isDefault: true,
		} as Domain.Contexts.Community.Role.EndUserRole.EndUserRoleEntityReference;

		const mockNewMember: MockMember = {
			id: 'member-123',
			memberName: 'Test User',
			communityId: 'community-123',
			role: mockDefaultRole,
		};

		const mockSavedMember = {
			id: 'member-123',
			memberName: 'Test User',
		} as Domain.Contexts.Community.Member.MemberEntityReference;

		// Mock the role repository to return a default role
		mockRoleRepository.getByCommunityId.mockResolvedValue([
			{
				id: 'role-456',
				roleName: 'Admin Role',
				isDefault: false,
			},
			mockDefaultRole,
		]);

		// Mock the member repository
		mockMemberRepository.getNewInstance.mockResolvedValue(mockNewMember);
		mockMemberRepository.save.mockResolvedValue(mockSavedMember);

		// Act
		const result = await createMember(mockDataSources as unknown as Parameters<typeof createMember>[0])(command);

		// Assert
		expect(result).toBe(mockSavedMember);
		expect(mockRoleRepository.getByCommunityId).toHaveBeenCalledWith('community-123');
		expect(mockMemberRepository.getNewInstance).toHaveBeenCalledWith('Test User', { id: 'community-123' });
		expect(mockNewMember.role).toBe(mockDefaultRole);
		expect(mockMemberRepository.save).toHaveBeenCalledWith(mockNewMember);
	});

	it('should throw error when no default role is found', async () => {
		// Arrange
		const command: MemberCreateCommand = {
			memberName: 'Test User',
			communityId: 'community-123',
		};

		// Mock the role repository to return no default role
		mockRoleRepository.getByCommunityId.mockResolvedValue([
			{
				id: 'role-456',
				roleName: 'Admin Role',
				isDefault: false,
			},
			{
				id: 'role-789',
				roleName: 'Manager Role',
				isDefault: false,
			},
		]);

		// Act & Assert
		await expect(createMember(mockDataSources as unknown as Parameters<typeof createMember>[0])(command)).rejects.toThrow('No default role found for this community');

		expect(mockRoleRepository.getByCommunityId).toHaveBeenCalledWith('community-123');
		expect(mockMemberRepository.getNewInstance).not.toHaveBeenCalled();
		expect(mockMemberRepository.save).not.toHaveBeenCalled();
	});

	it('should throw error when member save fails', async () => {
		// Arrange
		const command: MemberCreateCommand = {
			memberName: 'Test User',
			communityId: 'community-123',
		};

		const mockDefaultRole = {
			id: 'role-123',
			roleName: 'Default Member',
			isDefault: true,
		} as Domain.Contexts.Community.Role.EndUserRole.EndUserRoleEntityReference;

		const mockNewMember: MockMember = {
			id: 'member-123',
			memberName: 'Test User',
			communityId: 'community-123',
			role: mockDefaultRole,
		};

		// Mock the role repository to return a default role
		mockRoleRepository.getByCommunityId.mockResolvedValue([mockDefaultRole]);

		// Mock the member repository
		mockMemberRepository.getNewInstance.mockResolvedValue(mockNewMember);
		mockMemberRepository.save.mockResolvedValue(undefined); // Simulate failure

		// Act & Assert
		await expect(createMember(mockDataSources as unknown as Parameters<typeof createMember>[0])(command)).rejects.toThrow('Unable to create member');

		expect(mockRoleRepository.getByCommunityId).toHaveBeenCalledWith('community-123');
		expect(mockMemberRepository.getNewInstance).toHaveBeenCalledWith('Test User', { id: 'community-123' });
		expect(mockMemberRepository.save).toHaveBeenCalledWith(mockNewMember);
	});
});
