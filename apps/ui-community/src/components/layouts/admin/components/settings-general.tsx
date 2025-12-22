import { Button, Descriptions, Form, Input, Typography } from 'antd';
import dayjs from 'dayjs';
import type React from 'react';
import type {
	AdminSettingsGeneralContainerCommunityFieldsFragment,
	CommunityUpdateSettingsInput,
} from '../../../../generated.tsx';

const { Text } = Typography;

interface SettingsGeneralProps {
	data: AdminSettingsGeneralContainerCommunityFieldsFragment;
	onSave: (values: CommunityUpdateSettingsInput) => Promise<void>;
	loading?: boolean;
}

export type { SettingsGeneralProps };

export const SettingsGeneral: React.FC<SettingsGeneralProps> = (props) => {
	const [form] = Form.useForm();
	const data = props.data;

	return (
		<>
			<Descriptions title="Community Info" size={'small'} layout={'vertical'}>
				<Descriptions.Item label="Id">{props.data.id}</Descriptions.Item>
				<Descriptions.Item label="Created At">
					{dayjs(props.data.createdAt).format('MM/DD/YYYY')}
				</Descriptions.Item>
				<Descriptions.Item label="Updated At">
					{dayjs(props.data.updatedAt).format('MM/DD/YYYY')}
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
						defaultValue={data.whiteLabelDomain ?? undefined}
						maxLength={50}
					/>
				</Form.Item>
				<div className={'m-3'}>
					The white domain is used to allow users to access your public community
					website.
					<br />
					They will be able access it at: https://
					<Text strong>{data.whiteLabelDomain}</Text>.owner.community
					<br />
					<Text type={'danger'}>This is necessary</Text> to allow users to access
					your community website unless you have a custom domain you own. (see
					below)
				</div>

				<Form.Item name="domain" label="Domain">
					<Input
						placeholder="Domain"
						maxLength={50}
						defaultValue={data.domain ?? undefined}
					/>
				</Form.Item>
				<div className={'m-3'}>
					The domain is used to apply a custom domain to the public facing
					website.
					<br />
					You must have a domain name registered with us before you can use this
					feature.
					<br />
					Assign the CNAME of "www" to "cname.vercel-dns.com" in your DNS
					settings.
					<br />
					Once added, you can use the domain name in the white label field above.
					<br />
				</div>

				<Form.Item name="handle" label="Handle">
					<Input
						placeholder="Handle"
						maxLength={50}
						defaultValue={data.handle ?? undefined}
					/>
				</Form.Item>
				<Button type="primary" htmlType="submit" value={'save'} loading={props.loading}>
					Save
				</Button>
			</Form>
		</>
	);
};
