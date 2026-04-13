const INTERRUPT_SIGNALS = new Set(['SIGINT', 'SIGTERM', 'SIGQUIT']);
const INTERRUPT_EXIT_CODES = new Set([130, 143]);

export const isInterruptSignal = (signal) => Boolean(signal && INTERRUPT_SIGNALS.has(signal));

export const isInterruptExitCode = (code) => Number.isInteger(code) && INTERRUPT_EXIT_CODES.has(code);

export const isGracefulInterruptExit = (signal, code) => isInterruptSignal(signal) || isInterruptExitCode(code);
