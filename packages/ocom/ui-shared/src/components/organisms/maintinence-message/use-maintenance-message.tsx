import { useContext } from 'react';
import MaintenanceMessageContext, { type MaintenanceMessageInterface } from './maintenance-message-context.tsx';

const useMaintenanceMessage = (): MaintenanceMessageInterface => useContext(MaintenanceMessageContext);

export default useMaintenanceMessage;
