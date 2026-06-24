import { useMutation, useQuery } from '@apollo/client';
import { StaffAuthContext } from '@ocom/ui-staff-shared';
import { App, Spin } from 'antd';
import type React from 'react';
import { useContext } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { StaffRoleByIdDocument, StaffRolesListDocument, StaffRoleUpdateDocument } from '../generated.tsx';
import { StaffRoleCreate, type StaffRoleFormValues } from './staff-role-create.tsx';

const EnterpriseAppRoleNames = {
	CaseManager: 'Staff.CaseManager',
	ServiceLineOwner: 'Staff.ServiceLineOwner',
	Finance: 'Staff.Finance',
	TechAdmin: 'Staff.TechAdmin',
} as const;

function getAllowedEnterpriseAppRoles(enterpriseAppRole: string | undefined): string[] {
	switch (enterpriseAppRole) {
		case EnterpriseAppRoleNames.TechAdmin:
			return Object.values(EnterpriseAppRoleNames);
		case EnterpriseAppRoleNames.ServiceLineOwner:
			return [EnterpriseAppRoleNames.ServiceLineOwner, EnterpriseAppRoleNames.CaseManager];
		case EnterpriseAppRoleNames.CaseManager:
			return [EnterpriseAppRoleNames.CaseManager];
		case EnterpriseAppRoleNames.Finance:
			return [EnterpriseAppRoleNames.Finance];
		default:
			return [];
	}
}

export const StaffRoleEditContainer: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { message } = App.useApp();
	const auth = useContext(StaffAuthContext);
	const availableEnterpriseAppRoles = getAllowedEnterpriseAppRoles(auth?.enterpriseAppRole);
	const showTechAdminPermissions = auth?.permissions?.canManageTechAdmin === true;
	const canEditRole =
		auth?.permissions?.canEditRole === true ||
		auth?.permissions?.canManageStaffRolesAndPermissions === true ||
		auth?.permissions?.canManageTechAdmin === true;

	const { data, loading: queryLoading } = useQuery(StaffRoleByIdDocument, {
		variables: { id: id ?? '' },
		skip: !id,
	});

	const [staffRoleUpdate, { loading: mutationLoading }] = useMutation(StaffRoleUpdateDocument, {
		refetchQueries: [{ query: StaffRolesListDocument }],
	});

	if (!canEditRole) {
		return (
			<Navigate
				to="/unauthorized"
				replace
			/>
		);
	}

	const handleSubmit = async (values: StaffRoleFormValues) => {
		if (!id) return;
		try {
			const result = await staffRoleUpdate({
				variables: {
					input: {
						id,
						roleName: values.roleName,
						enterpriseAppRole: values.enterpriseAppRole,
						permissions: {
							communityPermissions: {
								canManageCommunities: values.canManageCommunities,
								canManageStaffRolesAndPermissions: values.canManageStaffRolesAndPermissions,
								canManageAllCommunities: values.canManageAllCommunities,
								canDeleteCommunities: values.canDeleteCommunities,
								canChangeCommunityOwner: values.canChangeCommunityOwner,
								canReIndexSearchCollections: values.canReIndexSearchCollections,
							},
							userPermissions: {
								canManageUsers: values.canManageUsers,
								canAssignStaffRoles: values.canAssignStaffRoles,
								canViewStaffUsers: values.canViewStaffUsers,
							},
							staffRolePermissions: {
								canViewRoles: values.canViewRoles,
								canAddRole: values.canAddRole,
								canEditRole: values.canEditRole,
								canRemoveRole: values.canRemoveRole,
							},
							financePermissions: {
								canManageFinance: values.canManageFinance,
								canViewGLBatchSummaries: values.canViewGLBatchSummaries,
								canViewFinanceConfigs: values.canViewFinanceConfigs,
								canCreateFinanceConfigs: values.canCreateFinanceConfigs,
							},
							...(showTechAdminPermissions
								? {
										techAdminPermissions: {
											canManageTechAdmin: values.canManageTechAdmin,
											canViewDatabaseExplorer: values.canViewDatabaseExplorer,
											canViewBlobExplorer: values.canViewBlobExplorer,
											canViewQueueDashboard: values.canViewQueueDashboard,
											canSendQueueMessages: values.canSendQueueMessages,
										},
									}
								: {}),
						},
					},
				},
			});
			if (result.data?.staffRoleUpdate.status.success) {
				message.success('Role updated successfully');
				navigate('..');
			} else {
				message.error(result.data?.staffRoleUpdate.status.errorMessage ?? 'Failed to update role');
			}
		} catch (_err) {
			message.error('Failed to update role');
		}
	};

	const handleCancel = () => {
		navigate('..');
	};

	if (queryLoading) {
		return (
			<div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
				<Spin size="large" />
			</div>
		);
	}

	const role = data?.staffRoleById;
	const initialValues: Partial<StaffRoleFormValues> = role
		? {
				roleName: role.roleName,
				enterpriseAppRole: role.enterpriseAppRole,
				canManageCommunities: role.permissions?.communityPermissions.canManageCommunities,
				canManageStaffRolesAndPermissions: role.permissions?.communityPermissions.canManageStaffRolesAndPermissions,
				canManageAllCommunities: role.permissions?.communityPermissions.canManageAllCommunities,
				canDeleteCommunities: role.permissions?.communityPermissions.canDeleteCommunities,
				canChangeCommunityOwner: role.permissions?.communityPermissions.canChangeCommunityOwner,
				canReIndexSearchCollections: role.permissions?.communityPermissions.canReIndexSearchCollections,
				canManageUsers: role.permissions?.userPermissions.canManageUsers,
				canAssignStaffRoles: role.permissions?.userPermissions.canAssignStaffRoles,
				canViewStaffUsers: role.permissions?.userPermissions.canViewStaffUsers,
				canViewRoles: role.permissions?.staffRolePermissions.canViewRoles,
				canAddRole: role.permissions?.staffRolePermissions.canAddRole,
				canEditRole: role.permissions?.staffRolePermissions.canEditRole,
				canRemoveRole: role.permissions?.staffRolePermissions.canRemoveRole,
				canManageFinance: role.permissions?.financePermissions.canManageFinance,
				canViewGLBatchSummaries: role.permissions?.financePermissions.canViewGLBatchSummaries,
				canViewFinanceConfigs: role.permissions?.financePermissions.canViewFinanceConfigs,
				canCreateFinanceConfigs: role.permissions?.financePermissions.canCreateFinanceConfigs,
				canManageTechAdmin: role.permissions?.techAdminPermissions.canManageTechAdmin,
				canViewDatabaseExplorer: role.permissions?.techAdminPermissions.canViewDatabaseExplorer,
				canViewBlobExplorer: role.permissions?.techAdminPermissions.canViewBlobExplorer,
				canViewQueueDashboard: role.permissions?.techAdminPermissions.canViewQueueDashboard,
				canSendQueueMessages: role.permissions?.techAdminPermissions.canSendQueueMessages,
			}
		: {};

	return (
		<StaffRoleCreate
			mode="edit"
			onSubmit={handleSubmit}
			onCancel={handleCancel}
			loading={mutationLoading}
			availableEnterpriseAppRoles={availableEnterpriseAppRoles}
			showTechAdminPermissions={showTechAdminPermissions}
			initialValues={initialValues}
		/>
	);
};
