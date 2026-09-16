const { PAYMENT_PROVIDER } = process.env;

/**
 * Which payment provider the API should use.
 *
 * `@ocom/service-payment` currently only ships an in-memory mock: it loses payment
 * instruments on restart, is not shared across instances, and approves almost every
 * token. It must never back real billing, so production startup fails unless a real
 * provider has been configured here.
 */
const provider = PAYMENT_PROVIDER ?? 'mock';

const isMockProvider = provider === 'mock';

export { isMockProvider };
