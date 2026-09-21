import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { PaymentInstrumentDisplay } from './payment-instrument-display.tsx';

const meta = {
	title: 'Components/Shared/PaymentInstrumentDisplay',
	component: PaymentInstrumentDisplay,
	parameters: {
		layout: 'padded',
	},
} satisfies Meta<typeof PaymentInstrumentDisplay>;

export default meta;
type Story = StoryObj<typeof PaymentInstrumentDisplay>;

export const OnFile: Story = {
	args: {
		paymentInstrument: {
			maskedCardNumber: 'XXXX-XXXX-XXXX-1111',
			brand: 'visa',
			expirationMonth: '12',
			expirationYear: '2030',
		},
	},
	play: ({ canvasElement }) => {
		const canvas = within(canvasElement);

		expect(canvas.getByText('XXXX-XXXX-XXXX-1111')).toBeInTheDocument();
		expect(canvas.getByText('visa')).toBeInTheDocument();
		expect(canvas.getByText('exp 12/2030')).toBeInTheDocument();
	},
};

export const NoInstrument: Story = {
	args: {
		paymentInstrument: null,
	},
	play: ({ canvasElement }) => {
		const display = canvasElement.querySelector('[data-testid="payment-instrument-display"]');

		expect(display).not.toBeNull();
		expect(display?.textContent).toBe('');
	},
};
