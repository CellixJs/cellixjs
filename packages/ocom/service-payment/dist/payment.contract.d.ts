import type { PaymentService } from '@cellix/service-payment';
/**
 * Payment operations available to OCOM application services.
 *
 * Lifecycle concerns remain infrastructure-only; all vendor-neutral payment operations are
 * available for future application workflows.
 */
export type PaymentOperations = PaymentService;
