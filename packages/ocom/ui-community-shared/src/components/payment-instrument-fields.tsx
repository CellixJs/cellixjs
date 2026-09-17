import { Form, type FormRule, Input } from 'antd';
import type React from 'react';

export interface PaymentInstrumentFormValues {
	paymentToken?: string | undefined;
	billingName?: string | undefined;
	billingEmail?: string | undefined;
	billingAddress?: string | undefined;
	billingCity?: string | undefined;
	billingState?: string | undefined;
	billingPostalCode?: string | undefined;
	billingCountry?: string | undefined;
}

export const BILLING_DETAIL_FIELD_NAMES = ['billingName', 'billingEmail', 'billingAddress', 'billingCity', 'billingState', 'billingPostalCode', 'billingCountry'] as const;

export const PAYMENT_INSTRUMENT_FIELD_NAMES = ['paymentToken', ...BILLING_DETAIL_FIELD_NAMES] as const;

const isFilled = (value: unknown): boolean => String(value ?? '').trim() !== '';

export const hasPaymentInstrumentInput = (values: PaymentInstrumentFormValues | undefined): boolean => PAYMENT_INSTRUMENT_FIELD_NAMES.some((field) => isFilled(values?.[field]));

export const hasBillingDetailInput = (values: PaymentInstrumentFormValues | undefined): boolean => BILLING_DETAIL_FIELD_NAMES.some((field) => isFilled(values?.[field]));

/** GraphQL-friendly payment instrument shape: absent values are explicit nulls rather than `undefined`. */
export interface PaymentInstrumentInputValues {
	paymentToken: string | null;
	billingName: string | null;
	billingEmail: string | null;
	billingAddress: string | null;
	billingCity: string | null;
	billingState: string | null;
	billingPostalCode: string | null;
	billingCountry: string | null;
}

export const toPaymentInstrumentInput = (values: PaymentInstrumentFormValues): PaymentInstrumentInputValues => ({
	paymentToken: values.paymentToken?.trim() ?? null,
	billingName: values.billingName ?? null,
	billingEmail: values.billingEmail ?? null,
	billingAddress: values.billingAddress ?? null,
	billingCity: values.billingCity ?? null,
	billingState: values.billingState ?? null,
	billingPostalCode: values.billingPostalCode ?? null,
	billingCountry: values.billingCountry ?? null,
});

export const toPaymentInstrumentValues = (values: PaymentInstrumentFormValues): PaymentInstrumentFormValues => ({
	paymentToken: values.paymentToken?.trim(),
	billingName: values.billingName,
	billingEmail: values.billingEmail,
	billingAddress: values.billingAddress,
	billingCity: values.billingCity,
	billingState: values.billingState,
	billingPostalCode: values.billingPostalCode,
	billingCountry: values.billingCountry,
});

export interface PaymentInstrumentFieldsProps {
	paymentTokenRules?: FormRule[];
}

export const PaymentInstrumentFields: React.FC<PaymentInstrumentFieldsProps> = (props) => {
	return (
		<>
			<Form.Item
				name="paymentToken"
				label="Payment token"
				rules={props.paymentTokenRules ?? []}
				extra="A tokenized card reference issued by the payment gateway. Card details are never stored by this application."
			>
				<Input maxLength={100} />
			</Form.Item>
			<Form.Item
				name="billingName"
				label="Billing name"
			>
				<Input maxLength={200} />
			</Form.Item>
			<Form.Item
				name="billingEmail"
				label="Billing email"
				rules={[{ type: 'email', message: 'Enter a valid billing email address.' }]}
			>
				<Input maxLength={200} />
			</Form.Item>
			<Form.Item
				name="billingAddress"
				label="Billing address"
			>
				<Input maxLength={200} />
			</Form.Item>
			<Form.Item
				name="billingCity"
				label="Billing city"
			>
				<Input maxLength={100} />
			</Form.Item>
			<Form.Item
				name="billingState"
				label="Billing state"
			>
				<Input maxLength={100} />
			</Form.Item>
			<Form.Item
				name="billingPostalCode"
				label="Billing postal code"
			>
				<Input maxLength={20} />
			</Form.Item>
			<Form.Item
				name="billingCountry"
				label="Billing country"
			>
				<Input maxLength={100} />
			</Form.Item>
		</>
	);
};
