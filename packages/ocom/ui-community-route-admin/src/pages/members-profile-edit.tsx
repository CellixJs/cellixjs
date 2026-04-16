import { useMutation, useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import { App, Button, Form, Input, Switch } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import type { MemberUpdateProfileInput } from '../generated.tsx';
import { AdminMembersProfileMemberDocument, AdminMembersProfileUpdateDocument } from '../generated.tsx';

interface MembersProfileEditParams {
	id?: string;
	communityId?: string;
	memberId?: string;
	[key: string]: string | undefined;
}

export const MembersProfileEdit: React.FC = () => {
	const { message } = App.useApp();
	const navigate = useNavigate();
	const params = useParams<MembersProfileEditParams>();
	const communityId = params.communityId ?? '';
	const adminMemberId = params.memberId ?? '';
	const memberId = params.id ?? '';
	const [form] = Form.useForm<MemberUpdateProfileInput['profile']>();
	const [memberUpdateProfile, { loading: memberUpdateLoading }] = useMutation(AdminMembersProfileUpdateDocument);
	const {
		data: memberData,
		loading: memberLoading,
		error: memberError,
	} = useQuery(AdminMembersProfileMemberDocument, {
		variables: { id: memberId },
		skip: !memberId,
	});
	const member = memberData?.member ?? null;

	const handleSave = async (profile: MemberUpdateProfileInput['profile']) => {
		try {
			const result = await memberUpdateProfile({
				variables: {
					input: {
						memberId,
						profile,
					},
				},
			});
			if (result.data?.memberUpdateProfile.status.success) {
				message.success('Member profile updated');
				navigate(`/community/${communityId}/admin/${adminMemberId}/members/${memberId}/profile`);
			} else {
				message.error(result.data?.memberUpdateProfile.status.errorMessage || 'Failed to update member profile');
			}
		} catch (error) {
			message.error(`Error Updating Member Profile: ${JSON.stringify(error)}`);
		}
	};

	return (
		<ComponentQueryLoader
			loading={memberLoading}
			hasData={member}
			error={memberError}
			noDataComponent={<div>No member profile found</div>}
			hasDataComponent={
				<Form
					layout="vertical"
					form={form}
					initialValues={{
						name: member?.profile?.name ?? member?.memberName ?? '',
						email: member?.profile?.email ?? '',
						bio: member?.profile?.bio ?? '',
						showEmail: member?.profile?.showEmail ?? false,
						showProfile: member?.profile?.showProfile ?? false,
						showInterests: member?.profile?.showInterests ?? false,
						showLocation: member?.profile?.showLocation ?? false,
						showProperties: member?.profile?.showProperties ?? false,
					}}
					onFinish={(values) => handleSave(values)}
				>
					<Form.Item
						name="name"
						label="Name"
					>
						<Input
							placeholder="Name"
							maxLength={200}
						/>
					</Form.Item>
					<Form.Item
						name="email"
						label="Email"
					>
						<Input
							placeholder="Email"
							maxLength={254}
						/>
					</Form.Item>
					<Form.Item
						name="bio"
						label="Bio"
					>
						<Input.TextArea
							placeholder="Bio"
							rows={4}
							maxLength={2000}
						/>
					</Form.Item>
					<Form.Item
						name="showProfile"
						label="Show Profile"
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
						name="showInterests"
						label="Show Interests"
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
					<Button
						type="primary"
						htmlType="submit"
						loading={memberUpdateLoading}
					>
						Save Profile
					</Button>
				</Form>
			}
		/>
	);
};
