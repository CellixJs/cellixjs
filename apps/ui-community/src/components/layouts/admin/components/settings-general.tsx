import { Button, Descriptions, Form, Input } from 'antd';
import type React from 'react';
import type {
	AdminSettingsGeneralContainerCommunityFieldsFragment,
	CommunityUpdateSettingsInput,
} from '../../../../generated.tsx';

interface SettingsGeneralProps {
	data: AdminSettingsGeneralContainerCommunityFieldsFragment;
	onSave: (values: CommunityUpdateSettingsInput) => void;
	loading?: boolean;
}

export type { SettingsGeneralProps };

export const SettingsGeneral: React.FC<SettingsGeneralProps> = (props) => {
	const [form] = Form.useForm();

	return (
		<>
			<Descriptions title="Community Info" size={'small'} layout={'vertical'}>
				<Descriptions.Item label="Id">{props.data.id}</Descriptions.Item>
				<Descriptions.Item label="Created At">
					{props.data.createdAt ? new Date(props.data.createdAt).toLocaleDateString() : 'N/A'}
				</Descriptions.Item>
				<Descriptions.Item label="Updated At">
					{props.data.updatedAt ? new Date(props.data.updatedAt).toLocaleDateString() : 'N/A'}
				</Descriptions.Item>
			</Descriptions>

			<Form
				layout="vertical"
				form={form}
				initialValues={props.data}
				onFinish={(values) => {
					props.onSave(values);
				}}
			>
				<Form.Item
					name="name"
					label="Name"
					rules={[{ required: true, message: 'Community Name is required.' }]}
				>
					<Input placeholder="Name" maxLength={200} />
				</Form.Item>
				<Form.Item name="whiteLabelDomain" label="White Label Domain">
					<Input
						placeholder="White Label Domain"
						defaultValue={props.data.whiteLabelDomain ?? undefined}
						maxLength={500}
					/>
				</Form.Item>
				<div className={'m-3'}>
					The white label domain is used to allow users to access your public community
					website.
				</div>

				<Form.Item name="domain" label="Domain">
					<Input
						placeholder="Domain"
						maxLength={500}
						defaultValue={props.data.domain ?? undefined}
					/>
				</Form.Item>
				<div className={'m-3'}>
					The domain is used to apply a custom domain to the public facing website.
					<br />
					You must have a domain name registered with us before you can use this feature.
					<br />
				</div>

				<Form.Item name="handle" label="Handle">
					<Input
						placeholder="Handle"
						maxLength={50}
						defaultValue={props.data.handle ?? undefined}
					/>
				</Form.Item>
				<Button type="primary" htmlType="submit" value={'save'} loading={props.loading}>
					Save
				</Button>
			</Form>
		</>
	);
};
