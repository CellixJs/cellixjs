import type { Meta, StoryObj } from '@storybook/react-vite';
import { App } from 'antd';
import { expect, fn, userEvent, within } from 'storybook/test';
import { CommunityBilling, type CommunityBillingProps } from './community-billing.tsx';

const baseProps: CommunityBillingProps = {
	subscriptionTier: 'pro',
	pricePerMember: 1000,
	currency: 'USD',
	memberCount: 3,
	amount: 3000,
	transactions: [
		{ id: 'txn-1', amount: 3000, isSuccess: true },
		{ id: 'txn-2', amount: 3000, isSuccess: false },
	],
	paymentInstrument: {
		maskedCardNumber: 'XXXX-XXXX-XXXX-1111',
		brand: 'visa',
		expirationMonth: '12',
		expirationYear: '2030',
	},
	onSave: fn(),
	onProcessCharge: fn(),
};

const meta = {
	title: 'Components/Layouts/Admin/CommunityBilling',
	component: CommunityBilling,
	parameters: {
		layout: 'padded',
	},
	decorators: [
		(Story) => (
			<App>
				<Story />
			</App>
		),
	],
} satisfies Meta<typeof CommunityBilling>;

export default meta;
type Story = StoryObj<typeof CommunityBilling>;

export const Default: Story = {
	args: baseProps,
	play: ({ canvasElement }) => {
		const canvas = within(canvasElement);

		expect(canvas.getByTestId('community-subscription-tier')).toHaveTextContent('Pro');
		expect(canvas.getByTestId('community-price-per-member')).toHaveTextContent('$10.00');
		expect(canvas.getByTestId('community-billed-member-count')).toHaveTextContent('3');
		expect(canvas.getByTestId('community-billing-amount')).toHaveTextContent('$30.00');
		expect(canvas.getByTestId('community-billing-currency')).toHaveTextContent('USD');
		expect(canvas.getByTestId('billing-history')).toHaveTextContent('3000 cents · Success');
		expect(canvas.getByTestId('billing-history')).toHaveTextContent('3000 cents · Failed');
	},
};

export const ProcessesACharge: Story = {
	args: { ...baseProps, onProcessCharge: fn() },
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);

		await userEvent.click(canvas.getByTestId('process-subscription-charge'));

		expect(args.onProcessCharge).toHaveBeenCalled();
	},
};

export const WithoutPaymentInstrument: Story = {
	args: { ...baseProps, paymentInstrument: null, transactions: [], onProcessCharge: fn() },
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);

		expect(canvas.getByText('No card on file.')).toBeInTheDocument();
		await userEvent.click(canvas.getByTestId('process-subscription-charge'));

		expect(args.onProcessCharge).not.toHaveBeenCalled();
	},
};

export const RevealsPaymentInstrumentFields: Story = {
	args: baseProps,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		await userEvent.click(canvas.getByRole('button', { name: /Update payment instrument/i }));

		expect(canvas.getByLabelText('Payment token')).toBeInTheDocument();
		expect(canvas.getByLabelText('Billing postal code')).toBeInTheDocument();
	},
};
