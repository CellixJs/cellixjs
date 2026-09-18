import dayjs from 'dayjs';
import React, { type FC, type ReactNode, useEffect, useMemo, useState } from 'react';
import { useFeatureFlags } from '../feature-flag/index.tsx';
import { isInStorybookEnv } from '../feature-flag/is-in-storybook-env.ts';
import { MaintenanceKickoutMessage } from './maintenance-kickout-message.tsx';
import MaintenanceMessageContext from './maintenance-message-context.tsx';

/** Application services used by maintenance without prescribing a transport or authentication library. */
export interface MaintenanceMessageRuntime {
	/** Fetch the current server timestamp. Rejections are logged and leave the current state unchanged. */
	getServerDate: () => Promise<string | undefined>;
	/** Whether the current user participates in the countdown and kickout flow. */
	isAuthenticated: boolean;
	/** Run the application's kickout actions when the authenticated countdown reaches zero; not awaited. */
	onMaintenanceKickout: () => void;
}

/** Inputs for a maintenance scope; applications own portal identity and runtime integration. */
export interface MaintenanceMessageProviderProps {
	children: ReactNode;
	portalKey: string;
	runtime: MaintenanceMessageRuntime;
	timeoutBeforeMaintenance?: number;
	storybookShowImpendingMessage?: boolean;
	storybookShowMaintenanceMessage?: boolean;
}

const formatTimeCounter = (time: number) => {
	const minutes = Math.floor(time / 60);
	const seconds = time % 60;
	return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
};

/**
 * Tracks feature-flag maintenance windows using a caller-provided server clock.
 * @param props - Portal key, runtime, countdown threshold in seconds, and child content.
 * @returns A maintenance context and, for authenticated users approaching maintenance, a countdown warning.
 * @remarks Checks the clock immediately and every five seconds while enabled. Clock failures are logged;
 * kickout actions are delegated without awaiting. Wrap this in FeatureFlagProvider and keep runtime callbacks stable.
 * @example
 * ```tsx
 * <MaintenanceMessageProvider portalKey="CUSTOMER" runtime={runtime} timeoutBeforeMaintenance={120}>
 *   <ApplicationRoutes />
 * </MaintenanceMessageProvider>
 * ```
 */
const MaintenanceMessageProvider: FC<MaintenanceMessageProviderProps> = (props: MaintenanceMessageProviderProps): React.JSX.Element => {
	const timeoutValue = props.timeoutBeforeMaintenance && props.timeoutBeforeMaintenance > 0 ? props.timeoutBeforeMaintenance : 120;
	const portalKey = props.portalKey;
	const [isImpending, setIsImpending] = useState<boolean | undefined>(undefined);
	const [isMaintenance, setIsMaintenance] = useState<boolean | undefined>(undefined);
	const [isApproachingMaintenance, setIsApproachingMaintenance] = useState(false);
	const [maintenanceCountdown, setMaintenanceCountdown] = useState<number>(timeoutValue); //in seconds
	const timerInstance = React.useRef<ReturnType<typeof setInterval> | undefined>(undefined);
	const { getServerDate, isAuthenticated, onMaintenanceKickout } = props.runtime;
	const { GetFeatureFlagByName } = useFeatureFlags();

	const impendingMaintenanceStartTimestamp = GetFeatureFlagByName(`MAINTENANCE_IMPENDING_TIMESTAMP_${portalKey}`);
	const maintenanceStartTimestamp = GetFeatureFlagByName(`MAINTENANCE_START_TIMESTAMP_${portalKey}`);
	const maintenanceEndTimestamp = GetFeatureFlagByName(`MAINTENANCE_END_TIMESTAMP_${portalKey}`);
	const upcomingMaintenance = GetFeatureFlagByName(`MAINTENANCE_UPCOMING_${portalKey}`);
	const impendingMessage = GetFeatureFlagByName(`MAINTENANCE_MSG_IMPENDING_${portalKey}`);
	const maintenanceMessage = GetFeatureFlagByName(`MAINTENANCE_MSG_SYSTEM_${portalKey}`);

	useEffect(() => {
		if (maintenanceCountdown === 0 && isAuthenticated) {
			setIsApproachingMaintenance(false);
			onMaintenanceKickout();
		}
	}, [isAuthenticated, onMaintenanceKickout, maintenanceCountdown]);
	useEffect(() => {
		if (!isApproachingMaintenance || !isAuthenticated) {
			return;
		}
		const interval = setInterval(() => {
			setMaintenanceCountdown((countdown) => countdown - 1);
		}, 1000);
		//Clearing the interval
		return () => clearInterval(interval);
	}, [isAuthenticated, isApproachingMaintenance]);

	useEffect(() => {
		// use local feature flag when in storybook
		if (isInStorybookEnv()) {
			if (props.storybookShowImpendingMessage) {
				setIsMaintenance(false);
				setIsImpending(true);
				return;
			}
			if (props.storybookShowMaintenanceMessage) {
				setIsMaintenance(true);
				setIsImpending(false);
				return;
			} else {
				setIsMaintenance(false);
				setIsImpending(false);
				return;
			}
		}

		interface MaintenanceIntervalParams {
			maintenanceStartTimestamp: string;
			maintenanceEndTimestamp: string;
			impendingMaintenanceStartTimestamp: string;
			upcomingMaintenance: string;
		}
		const setIntervalImmediately = async (func: (params: MaintenanceIntervalParams) => Promise<void>, interval: number, params: MaintenanceIntervalParams) => {
			await func(params);
			return setInterval(func, interval, params);
		};

		const getMaintenanceMessageStatus = async (params: MaintenanceIntervalParams) => {
			//If the GetFeatureFlag hasn't resolved it will be empty string
			if (params.upcomingMaintenance === '') return;

			if (params.upcomingMaintenance !== 'true') {
				setIsMaintenance(false);
				setIsImpending(false);
				setIsApproachingMaintenance(false);
				return;
			}
			await getServerDate()
				.then((serverDate) => {
					const serverTime = dayjs(serverDate);
					const impendingTime = dayjs(params.impendingMaintenanceStartTimestamp);
					const maintenanceStartTime = dayjs(params.maintenanceStartTimestamp);
					const maintenanceEndTime = dayjs(params.maintenanceEndTimestamp);

					if (serverTime >= impendingTime && serverTime < maintenanceStartTime) {
						setIsMaintenance(false);
						setIsImpending(true);
						// within 1 minute before maintenance start
						if (maintenanceStartTime.diff(serverTime, 'seconds') <= timeoutValue) {
							setIsApproachingMaintenance(true);
							setMaintenanceCountdown(maintenanceStartTime.diff(serverTime, 'seconds'));
						}
					} else if (serverTime >= maintenanceStartTime && serverTime < maintenanceEndTime) {
						setIsMaintenance(true);
						setIsImpending(false);
						setIsApproachingMaintenance(false);
						return;
					} else {
						setIsMaintenance(false);
						setIsImpending(false);
						setIsApproachingMaintenance(false);
						return;
					}
				})
				.catch((exception: unknown) => {
					console.log('exception: ', exception);
				});
		};

		const intervalParams = {
			maintenanceStartTimestamp: maintenanceStartTimestamp,
			maintenanceEndTimestamp: maintenanceEndTimestamp,
			impendingMaintenanceStartTimestamp: impendingMaintenanceStartTimestamp,
			upcomingMaintenance: upcomingMaintenance,
		};

		if (timerInstance.current) {
			//cancel timer
			clearInterval(timerInstance.current);
			timerInstance.current = undefined;
		}
		setIntervalImmediately(getMaintenanceMessageStatus, 5000, intervalParams)
			.then((interval: ReturnType<typeof setInterval>) => {
				timerInstance.current = interval;
			})
			.catch((exception: unknown) => {
				console.log(exception);
			});

		// Cleanup on unmount
		return () => {
			if (timerInstance.current) {
				clearInterval(timerInstance.current);
				timerInstance.current = undefined;
			}
		};
	}, [impendingMaintenanceStartTimestamp, maintenanceEndTimestamp, maintenanceStartTimestamp, upcomingMaintenance, props.storybookShowImpendingMessage, props.storybookShowMaintenanceMessage, getServerDate, timeoutValue]);

	const contextValues = useMemo(
		() => ({
			isImpending: isImpending,
			isMaintenance: isMaintenance,
			impendingMessage: impendingMessage,
			maintenanceMessage: maintenanceMessage,
			impendingMaintenanceStartTimestamp: impendingMaintenanceStartTimestamp,
			maintenanceStartTimestamp: maintenanceStartTimestamp,
			maintenanceEndTimestamp: maintenanceEndTimestamp,
			isApproachingMaintenance: isApproachingMaintenance,
		}),
		[isImpending, isMaintenance, isApproachingMaintenance, impendingMessage, maintenanceMessage, impendingMaintenanceStartTimestamp, maintenanceStartTimestamp, maintenanceEndTimestamp],
	);

	return (
		<MaintenanceMessageContext.Provider value={contextValues}>
			{isApproachingMaintenance && isAuthenticated && <MaintenanceKickoutMessage timer={formatTimeCounter(maintenanceCountdown)} />}
			{props.children}
		</MaintenanceMessageContext.Provider>
	);
};

export default MaintenanceMessageProvider;
