import { Button, Form, Input } from 'antd';
import type React from 'react';
import type { PropertyCreateInput } from '../generated.tsx';

interface PropertiesCreateProps {
	onSave: (property: PropertyCreateInput) => void;
}

export const PropertiesCreate: React.FC<PropertiesCreateProps> = (props) => {
	const [form] = Form.useForm<PropertyCreateInput>();

	return (
		<div>
			<Form
				layout="vertical"
				form={form}
				initialValues={{ propertyName: '' }}
				onFinish={(values) => {
					props.onSave(values);
				}}
			>
				<Form.Item
					name={['propertyName']}
					label="Property Name"
					rules={[{ required: true, whitespace: true, message: 'Property name is required.' }]}
				>
					<Input
						placeholder="Property Name"
						maxLength={200}
					/>
				</Form.Item>

				<Button
					type="primary"
					htmlType="submit"
					value={'save'}
				>
					Create Property
				</Button>
			</Form>
		</div>
	);
};
