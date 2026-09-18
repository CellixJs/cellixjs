import { useContext } from 'react';
import MaintenanceMessageContext, { type MaintenanceMessageInterface } from './maintenance-message-context.tsx';

/**
 * Reads maintenance state for the nearest provider without fetching or changing it.
 * @returns Current flags, templates, timestamps, and approaching-maintenance state; initial booleans may be undefined.
 * @example
 * ```tsx
 * const { isMaintenance, isImpending } = useMaintenanceMessage();
 * ```
 */
const useMaintenanceMessage = (): MaintenanceMessageInterface => useContext(MaintenanceMessageContext);

export default useMaintenanceMessage;
