import { Form, type FormRule, Select } from 'antd';
import type React from 'react';

export type SubscriptionTier = 'pro' | 'enterprise';

export const SUBSCRIPTION_PLAN_OPTIONS: Array<{ value: SubscriptionTier; label: string }> = [
	{ value: 'pro', label: 'Pro' },
	{ value: 'enterprise', label: 'Enterprise' },
];

/**
 * Parses a tier the server sent. Returns undefined for anything unrecognised rather
 * than defaulting, so an unknown tier can never be silently saved back as Pro.
 * Pricing is deliberately not duplicated here: CommunityConfig is its source of truth.
 */
export const toSubscriptionTier = (plan?: string | null): SubscriptionTier | undefined => {
	const normalized = (plan ?? '').trim().toLowerCase();
	if (normalized === 'pro' || normalized === 'enterprise') {
		return normalized;
	}
	return undefined;
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

/** Formats an integer amount of minor currency units (cents) for display. */
export const formatCentsAsCurrency = (cents: number, currency = 'USD'): string => {
	try {
		return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
	} catch {
		// Unknown currency code: fall back to the amount plus the raw code.
		return `${(cents / 100).toFixed(2)} ${currency}`;
	}
};

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
