const { PAYMENT_PROVIDER } = process.env;

/**
 * Which payment provider implementation the API should register.
 *
 * - `mock`: the in-memory stub from `@ocom/service-payment`. It loses payment
 *   instruments on restart, is not shared across instances, and approves almost every
 *   token, so it is rejected outright in production.
 * - `unavailable`: no gateway. The API starts, but every billing operation fails
 *   loudly. This is the only supported production value until a real gateway exists.
 *
 * Any other value is rejected rather than quietly falling back to the mock.
 */
const provider = PAYMENT_PROVIDER ?? 'mock';

export { provider };
