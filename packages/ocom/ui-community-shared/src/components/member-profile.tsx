import { Button, Card, Descriptions, Form, Input, Space, Switch, Typography } from 'antd';
import dayjs from 'dayjs';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import type { SharedMemberProfileContainerMemberFieldsFragment } from '../generated.tsx';

const { Title } = Typography;
const { TextArea } = Input;

export interface MemberProfileFormValues {
	name: string;
	email: string;
	bio: string;
	showInterests: boolean;
	showEmail: boolean;
	showProfile: boolean;
	showLocation: boolean;
	showProperties: boolean;
}

interface MemberProfileProps {
	data: SharedMemberProfileContainerMemberFieldsFragment;
	isAdmin: boolean;
	loading: boolean;
	onSave: (values: MemberProfileFormValues) => Promise<boolean>;
}

export const MemberProfile: React.FC<MemberProfileProps> = ({ data, isAdmin, loading, onSave }) => {
	const [form] = Form.useForm<MemberProfileFormValues>();
	const [isEditing, setIsEditing] = useState(false);
	const profile = data?.profile;
	const initialValues = useMemo<MemberProfileFormValues>(
		() => ({
			name: profile?.name ?? '',
			email: profile?.email ?? '',
			bio: profile?.bio ?? '',
			showInterests: profile?.showInterests ?? false,
			showEmail: profile?.showEmail ?? false,
			showProfile: profile?.showProfile ?? false,
			showLocation: profile?.showLocation ?? false,
			showProperties: profile?.showProperties ?? false,
		}),
		[profile],
	);

	useEffect(() => {
		form.setFieldsValue(initialValues);
	}, [form, initialValues]);

	if (!data) {
		return <div>No member data available</div>;
	}

	return (
		<Card
			title={<Title level={3}>Member Profile</Title>}
			extra={
				!isEditing ? (
					<Button
						type="primary"
						onClick={() => setIsEditing(true)}
					>
						Edit Profile
					</Button>
				) : null
			}
		>
			{isEditing ? (
				<Form
					layout="vertical"
					form={form}
					initialValues={initialValues}
					onFinish={async (values) => {
						const didSave = await onSave(values);
						if (didSave) {
							setIsEditing(false);
						}
					}}
				>
					<Form.Item
						name="name"
						label="Display Name"
					>
						<Input
							placeholder="Display Name"
							maxLength={200}
						/>
					</Form.Item>
					<Form.Item
						name="email"
						label="Email"
						rules={[{ type: 'email', message: 'Please enter a valid email address' }]}
					>
						<Input
							placeholder="Email"
							maxLength={320}
						/>
					</Form.Item>
					<Form.Item
						name="bio"
						label="Bio"
					>
						<TextArea
							placeholder="Bio"
							autoSize={{ minRows: 3, maxRows: 6 }}
							maxLength={500}
						/>
					</Form.Item>
					<Form.Item
						name="showInterests"
						label="Show Interests"
						valuePropName="checked"
					>
						<Switch />
					</Form.Item>
					<Form.Item
						name="showEmail"
						label="Show Email"
						valuePropName="checked"
					>
						<Switch />
					</Form.Item>
					<Form.Item
						name="showProfile"
						label="Show Profile"
						valuePropName="checked"
					>
						<Switch />
					</Form.Item>
					<Form.Item
						name="showLocation"
						label="Show Location"
						valuePropName="checked"
					>
						<Switch />
					</Form.Item>
					<Form.Item
						name="showProperties"
						label="Show Properties"
						valuePropName="checked"
					>
						<Switch />
					</Form.Item>
					<Space>
						<Button
							type="primary"
							htmlType="submit"
							loading={loading}
						>
							Save Profile
						</Button>
						<Button
							onClick={() => {
								form.setFieldsValue(initialValues);
								setIsEditing(false);
							}}
						>
							Cancel
						</Button>
					</Space>
				</Form>
			) : (
				<Descriptions
					column={1}
					bordered
				>
					<Descriptions.Item label="Member Name">{data.memberName || 'Not set'}</Descriptions.Item>
					<Descriptions.Item label="Display Name">{profile?.name || 'Not set'}</Descriptions.Item>
					<Descriptions.Item label="Email">{profile?.email || 'Not set'}</Descriptions.Item>
					<Descriptions.Item label="Bio">{profile?.bio || 'Not set'}</Descriptions.Item>
					<Descriptions.Item label="Show Interests">{profile?.showInterests ? 'Yes' : 'No'}</Descriptions.Item>
					<Descriptions.Item label="Show Email">{profile?.showEmail ? 'Yes' : 'No'}</Descriptions.Item>
					<Descriptions.Item label="Show Profile">{profile?.showProfile ? 'Yes' : 'No'}</Descriptions.Item>
					<Descriptions.Item label="Show Location">{profile?.showLocation ? 'Yes' : 'No'}</Descriptions.Item>
					<Descriptions.Item label="Show Properties">{profile?.showProperties ? 'Yes' : 'No'}</Descriptions.Item>
					<Descriptions.Item label="Member Since">{dayjs(data.createdAt).format('MMMM DD, YYYY')}</Descriptions.Item>
					{isAdmin && <Descriptions.Item label="Last Updated">{dayjs(data.updatedAt).format('MMMM DD, YYYY HH:mm')}</Descriptions.Item>}
				</Descriptions>
			)}
		</Card>
	);
};
