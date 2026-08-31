import { useApolloClient, useLazyQuery } from '@apollo/client';
import dayjs from 'dayjs';
import React, { type FC, type ReactNode, useEffect, useMemo, useState } from 'react';
import { useAuth } from 'react-oidc-context';
import { useNavigate } from 'react-router-dom';
import { MaintenanceMessageProviderGetServerDateDocument } from '../../../generated.tsx';
import { useFeatureFlags } from '../feature-flag/index.tsx';
import { isInStorybookEnv } from '../feature-flag/is-in-storybook-env.ts';
import { HandleLogout } from '../header/handle-logout.tsx';
import { MaintenanceKickoutMessage } from './maintenance-kickout-message.tsx';
import MaintenanceMessageContext from './maintenance-message-context.tsx';

type MaintenanceMessageProviderProps = {
	children: ReactNode;
	// Portal-specific feature-flag suffix, e.g. 'UI_STAFF_PORTAL' or 'UI_COMMUNITY_PORTAL'.
	portalKey?: string;
	storybookShowImpendingMessage?: boolean;
	storybookShowMaintenanceMessage?: boolean;
};

const formatTimeCounter = (time: number) => {
	const minutes = Math.floor(time / 60);
	const seconds = time % 60;
	return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
};

const MaintenanceMessageProvider: FC<MaintenanceMessageProviderProps> = (props: MaintenanceMessageProviderProps): React.JSX.Element => {
	const timeoutEnv = import.meta.env['VITE_APP_UI_STAFF_TIMEOUT_BEFORE_MAINTENANCE'];
	const timeoutBeforeMaintenance = Number(timeoutEnv);
	const timeoutValue = !Number.isNaN(timeoutBeforeMaintenance) && timeoutBeforeMaintenance > 0 ? timeoutBeforeMaintenance : 120;
	const portalKey = props.portalKey ?? 'UI_STAFF_PORTAL';
	const [isImpending, setIsImpending] = useState<boolean | undefined>(undefined);
	const [isMaintenance, setIsMaintenance] = useState<boolean | undefined>(undefined);
	const [isApproachingMaintenance, setIsApproachingMaintenance] = useState(false);
	const [maintenanceCountdown, setMaintenanceCountdown] = useState<number>(timeoutValue); //in seconds
	const auth = useAuth();
	const timerInstance = React.useRef<ReturnType<typeof setInterval> | undefined>(undefined);
	const apolloClient = useApolloClient();
	const { GetFeatureFlagByName } = useFeatureFlags();

	const [getServerDate] = useLazyQuery(MaintenanceMessageProviderGetServerDateDocument, { fetchPolicy: 'network-only' });

	const impendingMaintenanceStartTimestamp = GetFeatureFlagByName(`MAINTENANCE_IMPENDING_TIMESTAMP_${portalKey}`);
	const maintenanceStartTimestamp = GetFeatureFlagByName(`MAINTENANCE_START_TIMESTAMP_${portalKey}`);
	const maintenanceEndTimestamp = GetFeatureFlagByName(`MAINTENANCE_END_TIMESTAMP_${portalKey}`);
	const upcomingMaintenance = GetFeatureFlagByName(`MAINTENANCE_UPCOMING_${portalKey}`);
	const impendingMessage = GetFeatureFlagByName(`MAINTENANCE_MSG_IMPENDING_${portalKey}`);
	const maintenanceMessage = GetFeatureFlagByName(`MAINTENANCE_MSG_SYSTEM_${portalKey}`);

	const navigate = useNavigate();

	useEffect(() => {
		if (maintenanceCountdown === 0 && auth.isAuthenticated) {
			setIsApproachingMaintenance(false);
			HandleLogout(auth, apolloClient, window.location.origin);
			navigate('/');
		}
	}, [maintenanceCountdown, auth, apolloClient, navigate]);
	useEffect(() => {
		if (!isApproachingMaintenance || !auth.isAuthenticated) {
			return;
		}
		const interval = setInterval(() => {
			setMaintenanceCountdown((countdown) => countdown - 1);
		}, 1000);
		//Clearing the interval
		return () => clearInterval(interval);
	}, [isApproachingMaintenance, auth]);

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
				.then((data) => {
					const serverDate = data.data?.serverDate;
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
	}, [
		impendingMaintenanceStartTimestamp,
		maintenanceEndTimestamp,
		maintenanceStartTimestamp,
		upcomingMaintenance,
		getServerDate,
		props.storybookShowImpendingMessage,
		props.storybookShowMaintenanceMessage,
		timeoutBeforeMaintenance,
	]);

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
			{isApproachingMaintenance && auth.isAuthenticated && <MaintenanceKickoutMessage timer={formatTimeCounter(maintenanceCountdown)} />}
			{props.children}
		</MaintenanceMessageContext.Provider>
	);
};

export default MaintenanceMessageProvider;
