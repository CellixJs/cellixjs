import { Button, Descriptions, Select, Space, Typography } from 'antd';
import type React from 'react';
import type { StaffUser } from './staff-users-list.tsx';

const { Title } = Typography;

interface StaffUserDetailProps {
	data: StaffUser;
	availableRoles: { id: string; roleName: string }[];
	canAssignRoles: boolean;
	isEditingOwnRole?: boolean;
	currentRoleName?: string;
	selectedRoleId: string | null;
	onRoleChange: (roleId: string) => void;
	onSave: () => void;
	saveDisabled?: boolean;
	loading?: boolean;
	saveLoading?: boolean;
}

export const StaffUserDetail: React.FC<StaffUserDetailProps> = ({ data, availableRoles, canAssignRoles, isEditingOwnRole = false, currentRoleName, selectedRoleId, onRoleChange, onSave, saveDisabled = false, loading, saveLoading = false }) => {
	return (
		<Space
			direction="vertical"
			size="large"
			style={{ width: '100%' }}
		>
			<Title level={4}>Staff User Details</Title>
			<Descriptions
				title="Identity (read-only)"
				bordered
				size="small"
				column={1}
			>
				<Descriptions.Item label="Display Name">{data.displayName}</Descriptions.Item>
				<Descriptions.Item label="Email">{data.email}</Descriptions.Item>
				<Descriptions.Item label="Created At">{new Date(data.createdAt).toLocaleDateString()}</Descriptions.Item>
			</Descriptions>
			<div>
				<div style={{ marginBottom: 8, fontWeight: 600 }}>Assigned Role</div>
				<Space direction="horizontal" size="small" align="start">
					<Select
						style={{ width: 240 }}
						value={selectedRoleId}
						disabled={!canAssignRoles}
						loading={!!loading}
						onChange={onRoleChange}
						options={availableRoles.map((r) => ({ value: r.id, label: r.roleName }))}
						placeholder={currentRoleName ? `${currentRoleName}` : 'No role assigned'}
					/>
					<Button
						type="primary"
						disabled={!canAssignRoles || saveDisabled}
						loading={!!saveLoading}
						onClick={onSave}
					>
						Save
					</Button>
					{isEditingOwnRole && (
						<div
							title="You cannot change your own assigned role"
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								width: 24,
								height: 24,
							}}
						>
						</div>
					)}
				</Space>
			</div>
		</Space>
	);
};
