const { PAYMENT_PROVIDER } = process.env;

/**
 * Which payment provider implementation the API should register.
 *
 * - `unavailable`: no gateway. The API starts and every billing operation fails
 *   loudly. This is the default so that an environment which has not opted in can
 *   never record fake charges, and so a missing setting cannot stop the app booting.
 * - `mock`: the in-memory stub from `@ocom/service-payment`. It loses payment
 *   instruments on restart, is not shared across instances, and approves almost every
 *   token, so it must be opted into explicitly and is rejected in production.
 *
 * Any other value is rejected rather than quietly falling back to a stub.
 */
const provider = PAYMENT_PROVIDER ?? 'unavailable';

export { provider };
