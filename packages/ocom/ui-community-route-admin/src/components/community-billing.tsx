import {
	formatCentsAsCurrency,
	hasPaymentInstrumentOnFile,
	PaymentInstrumentDisplay,
	PaymentInstrumentFields,
	type PaymentInstrumentFormValues,
	type PaymentInstrumentSummary,
	PRICE_PER_MEMBER_IN_CENTS,
	SubscriptionPlanSelect,
	toDisplayTier,
	toPaymentInstrumentValues,
	toSubscriptionTier,
} from '@ocom/ui-community-shared';
import { App, Button, Card, Descriptions, Form, Space, Typography } from 'antd';
import type React from 'react';
import { useState } from 'react';

const { Text, Title } = Typography;

export interface CommunityBillingTransaction {
	id: string;
	amount: number;
	isSuccess: boolean;
}

export interface CommunityBillingSaveValues {
	subscriptionTier?: string | undefined;
	paymentInstrument?: PaymentInstrumentFormValues | undefined;
}

export interface CommunityBillingProps {
	subscriptionTier: string;
	pricePerMember: number;
	currency: string;
	memberCount: number;
	amount: number;
	transactions: CommunityBillingTransaction[];
	paymentInstrument?: PaymentInstrumentSummary | null | undefined;
	saving?: boolean | undefined;
	charging?: boolean | undefined;
	onSave: (values: CommunityBillingSaveValues) => Promise<void>;
	onProcessCharge: () => Promise<void>;
}

type CommunityBillingFormValues = PaymentInstrumentFormValues & {
	subscriptionTier?: string | undefined;
};

const errorMessageOf = (error: unknown, fallback: string): string => (error instanceof Error && error.message ? error.message : fallback);

export const CommunityBilling: React.FC<CommunityBillingProps> = (props) => {
	const { message } = App.useApp();
	const [form] = Form.useForm<CommunityBillingFormValues>();
	const [editingInstrument, setEditingInstrument] = useState(false);
	const onFile = hasPaymentInstrumentOnFile(props.paymentInstrument);
	const currentTier = toSubscriptionTier(props.subscriptionTier);

	const handleFinish = async (values: CommunityBillingFormValues) => {
		const next: CommunityBillingSaveValues = {};
		if (values.subscriptionTier && toSubscriptionTier(values.subscriptionTier) !== currentTier) {
			next.subscriptionTier = toSubscriptionTier(values.subscriptionTier);
		}
		if (editingInstrument && String(values.paymentToken ?? '').trim() !== '') {
			next.paymentInstrument = toPaymentInstrumentValues(values);
		}
		try {
			await props.onSave(next);
			setEditingInstrument(false);
			form.resetFields(['paymentToken']);
		} catch (error) {
			message.error(errorMessageOf(error, 'Unable to save billing settings.'));
		}
	};

	const handleProcessCharge = async () => {
		if (!onFile) {
			message.error('A payment instrument is required before processing a subscription charge.');
			return;
		}
		try {
			await props.onProcessCharge();
		} catch (error) {
			message.error(errorMessageOf(error, 'Unable to process the subscription charge.'));
		}
	};

	return (
		<Space
			direction="vertical"
			size="large"
			style={{ display: 'flex' }}
		>
			<Card>
				<Descriptions
					title="Subscription"
					size="small"
					column={2}
				>
					<Descriptions.Item label="Current plan">
						<span data-testid="community-subscription-tier">{toDisplayTier(props.subscriptionTier)}</span>
					</Descriptions.Item>
					<Descriptions.Item label="Price per member">
						<span data-testid="community-price-per-member">{formatCentsAsCurrency(props.pricePerMember)}</span>
					</Descriptions.Item>
					<Descriptions.Item label="Billed members">
						<span data-testid="community-billed-member-count">{props.memberCount}</span>
					</Descriptions.Item>
					<Descriptions.Item label="Amount due">
						<span data-testid="community-billing-amount">{formatCentsAsCurrency(props.amount)}</span>
					</Descriptions.Item>
					<Descriptions.Item label="Billed in">
						<span data-testid="community-billing-currency">{props.currency}</span>
					</Descriptions.Item>
				</Descriptions>
				<Button
					data-testid="process-subscription-charge"
					type="primary"
					loading={props.charging ?? false}
					onClick={handleProcessCharge}
				>
					Process subscription charge
				</Button>
			</Card>

			<Card>
				<Title level={5}>Card on file</Title>
				<PaymentInstrumentDisplay paymentInstrument={props.paymentInstrument} />
				{onFile ? null : <Text type="secondary">No card on file.</Text>}
			</Card>

			<Card>
				<Form
					layout="vertical"
					form={form}
					initialValues={{ subscriptionTier: currentTier }}
					onFinish={handleFinish}
				>
					<SubscriptionPlanSelect />
					<Text type="secondary">{`${formatCentsAsCurrency(PRICE_PER_MEMBER_IN_CENTS[currentTier])} per member, per month.`}</Text>

					<div className="my-3">
						<Button
							htmlType="button"
							onClick={() => setEditingInstrument(true)}
						>
							Update payment instrument
						</Button>
					</div>

					{editingInstrument ? <PaymentInstrumentFields paymentTokenRules={[{ required: true, message: 'A payment instrument token is required.' }]} /> : null}

					<Button
						type="primary"
						htmlType="submit"
						loading={props.saving ?? false}
					>
						Save plan
					</Button>
				</Form>
			</Card>

			<Card>
				<Title level={5}>Billing history</Title>
				<div data-testid="billing-history">
					{props.transactions.map((transaction) => (
						<div key={transaction.id}>
							{`${transaction.amount} cents · ${transaction.isSuccess ? 'Success' : 'Failed'}`}
							{'\n'}
						</div>
					))}
				</div>
			</Card>
		</Space>
	);
};
