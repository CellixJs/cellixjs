import { createContext } from 'react';

export interface MaintenanceMessageInterface {
	isMaintenance: boolean | undefined;
	isImpending: boolean | undefined;
	impendingMessage?: string;
	maintenanceMessage?: string;
	impendingMaintenanceStartTimestamp: string;
	maintenanceStartTimestamp: string;
	maintenanceEndTimestamp: string;
	isApproachingMaintenance: boolean | undefined;
}

const initialContext = {
	isMaintenance: undefined,
	isImpending: undefined,
	impendingMessage: '',
	maintenanceMessage: '',
	impendingMaintenanceStartTimestamp: '',
	maintenanceStartTimestamp: '',
	maintenanceEndTimestamp: '',
	isApproachingMaintenance: undefined,
};

const MaintenanceMessageContext = createContext<MaintenanceMessageInterface>(initialContext);

export default MaintenanceMessageContext;
