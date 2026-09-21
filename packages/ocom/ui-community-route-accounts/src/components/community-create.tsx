import { Helmet } from '@dr.pogodin/react-helmet';
import { BILLING_DETAIL_FIELD_NAMES, hasPaymentInstrumentInput, PaymentInstrumentFields, type PaymentInstrumentFormValues, SubscriptionPlanSelect, toPaymentInstrumentInput } from '@ocom/ui-community-shared';
import { Button, Form, type FormRule, Input, Typography, theme } from 'antd';
import React from 'react';
import type { CommunityCreateInput } from '../generated.tsx';

type CommunityCreateFormValues = PaymentInstrumentFormValues & {
	name: string;
	subscriptionTier?: string | undefined;
};

export interface CommunityCreateProps {
	onSave: (values: CommunityCreateInput) => void;
}

const paymentTokenRules: FormRule[] = [
	({ getFieldValue }) => ({
		validator(_rule, value: unknown) {
			const wantsSubscription = Boolean(getFieldValue('subscriptionTier')) || BILLING_DETAIL_FIELD_NAMES.some((field) => String(getFieldValue(field) ?? '').trim() !== '');
			if (wantsSubscription && String(value ?? '').trim() === '') {
				return Promise.reject(new Error('A payment instrument is required to start a subscription.'));
			}
			return Promise.resolve();
		},
	}),
];

export const CommunityCreate: React.FC<CommunityCreateProps> = (props) => {
	const [form] = Form.useForm<CommunityCreateFormValues>();
	const [formLoading, setFormLoading] = React.useState(false);
	const selectedTier = Form.useWatch('subscriptionTier', form);
	const {
		token: { colorTextBase, colorBgContainer },
	} = theme.useToken();
	const { Title, Text } = Typography;

	const handleFinish = (values: CommunityCreateFormValues) => {
		setFormLoading(true);
		const input: CommunityCreateInput = { name: values.name };
		if (values.subscriptionTier) {
			input.subscriptionTier = values.subscriptionTier;
		}
		if (hasPaymentInstrumentInput(values)) {
			input.paymentInstrument = toPaymentInstrumentInput(values);
		}
		props.onSave(input);
		setFormLoading(false);
	};
	return (
		<>
			<div
				className={'w-full p-5 mx-auto my-5 shadow-lg rounded-lg border border-1'}
				style={{
					backgroundColor: colorBgContainer,
					color: colorTextBase,
				}}
			>
				<Helmet>
					<title>Create A Community</title>
				</Helmet>
				<Title level={3}>Creating your Community</Title>
				<p>
					Getting started with your community is only a few clicks away.
					<br />
					Once you create it here you'll see it in the list of communities you have access to. <br />
					You will have access to both the member side and the admin side of your community. <br />
					Start by creating a name for your community, you can always change it later, you may want to make the name descriptive to avoid confusion with other communities with the same or similar names.
				</p>
			</div>
			<Form
				layout="vertical"
				form={form}
				onFinish={handleFinish}
			>
				<Form.Item
					label="Name"
					name="name"
					rules={[{ required: true, message: 'Please input Name!' }]}
				>
					<Input placeholder="Name" />
				</Form.Item>

				<SubscriptionPlanSelect />
				{selectedTier ? <Text type="secondary">Members are billed monthly at the rate configured for this plan.</Text> : null}

				<PaymentInstrumentFields paymentTokenRules={paymentTokenRules} />

				<Button
					type="primary"
					htmlType="submit"
					loading={formLoading}
				>
					Create Community
				</Button>
			</Form>
		</>
	);
};
