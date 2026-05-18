import type { StaffUserCreateFormValues } from './staff-user-create.tsx';
import type { StaffRoleFormValues } from './staff-role-create.tsx';
import type { StaffRole } from './staff-roles-list.tsx';
import type { StaffUser } from './staff-users-list.tsx';

interface StaffRoleOption {
	id: string;
	roleName: string;
}

let staffRoles: StaffRole[] = [
	{
		id: 'role-tech-admin',
		roleName: 'Tech Admin',
		enterpriseAppRole: 'Staff.TechAdmin',
		createdAt: '2024-01-01T00:00:00.000Z',
		updatedAt: '2024-01-01T00:00:00.000Z',
	},
	{
		id: 'role-case-manager',
		roleName: 'Case Manager',
		enterpriseAppRole: 'Staff.CaseManager',
		createdAt: '2024-01-01T00:00:00.000Z',
		updatedAt: '2024-01-01T00:00:00.000Z',
	},
	{
		id: 'role-finance',
		roleName: 'Finance',
		enterpriseAppRole: 'Staff.Finance',
		createdAt: '2024-01-01T00:00:00.000Z',
		updatedAt: '2024-01-01T00:00:00.000Z',
	},
];

let staffUsers: StaffUser[] = [];

type StaffUserRole = NonNullable<StaffUser['role']>;

const findRoleById = (id?: string): StaffUserRole | null => {
	if (!id) {
		return null;
	}

	const role = staffRoles.find((item) => item.id === id);
	return role ? { id: role.id, roleName: role.roleName } : null;
};

const createId = (): string => `staff-user-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
const createRoleId = (): string => `staff-role-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

export const listStaffUsers = (): StaffUser[] => staffUsers;

export const listStaffRoles = (): StaffRole[] => staffRoles;

export const getAvailableStaffRoles = (): StaffRoleOption[] => staffRoles.map((role) => ({ id: role.id, roleName: role.roleName }));

export const findStaffUserById = (id: string): StaffUser | undefined => staffUsers.find((user) => user.id === id);

export const createStaffUser = (values: StaffUserCreateFormValues): StaffUser => {
	const newUser: StaffUser = {
		id: createId(),
		displayName: values.displayName,
		email: values.email,
		role: findRoleById(values.roleId),
		createdAt: new Date().toISOString(),
	};

	staffUsers = [newUser, ...staffUsers];
	return newUser;
};

export const assignStaffUserRole = (userId: string, roleId?: string): void => {
	staffUsers = staffUsers.map((user) => {
		if (user.id !== userId) {
			return user;
		}

		return {
			...user,
			role: findRoleById(roleId),
		};
	});
};

export const createStaffRole = (values: StaffRoleFormValues): StaffRole => {
	const now = new Date().toISOString();
	const newRole: StaffRole = {
		id: createRoleId(),
		roleName: values.roleName,
		enterpriseAppRole: values.enterpriseAppRole,
		createdAt: now,
		updatedAt: now,
	};

	staffRoles = [newRole, ...staffRoles];
	return newRole;
};
