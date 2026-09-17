import { Space, Tag, Typography } from 'antd';
import type React from 'react';

const { Text } = Typography;

export interface PaymentInstrumentSummary {
	maskedCardNumber?: string | null;
	brand?: string | null;
	expirationMonth?: string | null;
	expirationYear?: string | null;
}

export const hasPaymentInstrumentOnFile = (paymentInstrument?: PaymentInstrumentSummary | null): boolean => Boolean(paymentInstrument?.maskedCardNumber || paymentInstrument?.brand);

export interface PaymentInstrumentDisplayProps {
	paymentInstrument?: PaymentInstrumentSummary | null | undefined;
}

export const PaymentInstrumentDisplay: React.FC<PaymentInstrumentDisplayProps> = ({ paymentInstrument }) => {
	const onFile = hasPaymentInstrumentOnFile(paymentInstrument);
	const expiration = paymentInstrument?.expirationMonth && paymentInstrument?.expirationYear ? `exp ${paymentInstrument.expirationMonth}/${paymentInstrument.expirationYear}` : undefined;

	return (
		<div data-testid="payment-instrument-display">
			{onFile ? (
				<Space size="middle">
					{paymentInstrument?.brand ? <Tag>{paymentInstrument.brand}</Tag> : null}
					{paymentInstrument?.maskedCardNumber ? <Text>{paymentInstrument.maskedCardNumber}</Text> : null}
					{expiration ? <Text type="secondary">{expiration}</Text> : null}
				</Space>
			) : null}
		</div>
	);
};
