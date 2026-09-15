import { Form, type FormRule, Select } from 'antd';
import type React from 'react';

export type SubscriptionTier = 'pro' | 'enterprise';

export const SUBSCRIPTION_PLAN_OPTIONS: Array<{ value: SubscriptionTier; label: string }> = [
	{ value: 'pro', label: 'Pro' },
	{ value: 'enterprise', label: 'Enterprise' },
];

export const PRICE_PER_MEMBER_IN_CENTS: Record<SubscriptionTier, number> = {
	pro: 1000,
	enterprise: 2000,
};

export const toSubscriptionTier = (plan?: string | null): SubscriptionTier => {
	const normalized = (plan ?? '').trim().toLowerCase();
	return normalized === 'enterprise' ? 'enterprise' : 'pro';
};

export const toDisplayTier = (tier?: string | null): string => {
	const normalized = (tier ?? '').trim().toLowerCase();
	if (normalized === 'pro') {
		return 'Pro';
	}
	if (normalized === 'enterprise') {
		return 'Enterprise';
	}
	return (tier ?? '').trim();
};

export const formatCentsAsCurrency = (cents: number): string => `$${(cents / 100).toFixed(2)}`;

export interface SubscriptionPlanSelectProps {
	name?: string;
	rules?: FormRule[];
	placeholder?: string;
}

export const SubscriptionPlanSelect: React.FC<SubscriptionPlanSelectProps> = (props) => {
	return (
		<Form.Item
			name={props.name ?? 'subscriptionTier'}
			label="Subscription plan"
			rules={props.rules ?? []}
		>
			<Select
				placeholder={props.placeholder ?? 'Select a plan'}
				options={SUBSCRIPTION_PLAN_OPTIONS}
			/>
		</Form.Item>
	);
};
