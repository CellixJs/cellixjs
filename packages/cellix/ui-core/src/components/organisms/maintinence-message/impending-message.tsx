import { Alert } from 'antd';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';
import type { FC } from 'react';
import { useFeatureFlags } from '../feature-flag/index.tsx';
import type { MaintenanceMessageDisplayConfig } from './maintenance-message-config.ts';
import parse from './parse-html.ts';
import useMaintenanceMessage from './use-maintenance-message.tsx';

dayjs.extend(utc);
dayjs.extend(timezone);

interface ImpendingMessageProps {
	isRootPage?: boolean;
	portalKey: string;
	displayConfig: MaintenanceMessageDisplayConfig;
}

/**
 * Renders the selected portal's impending template with application-supplied formatting.
 * @param props - Portal identity, display settings, and whether to render in normal root-page flow.
 * @returns An alert with parsed template HTML; non-root alerts use the configured fixed top offset.
 * @remarks Render when useMaintenanceMessage reports isImpending. Templates must come from a trusted source;
 * HTML is parsed, not sanitized. Invalid timezone settings may throw during formatting.
 * @example
 * ```tsx
 * <ImpendingMessage portalKey="CUSTOMER" displayConfig={displayConfig} isRootPage />
 * ```
 */
const ImpendingMessage: FC<ImpendingMessageProps> = (props) => {
	const { portalKey, displayConfig } = props;
	const { GetFeatureFlagByName } = useFeatureFlags();
	const replaceTokens = (str: string, mapObj: Record<string, string>) => {
		const re = new RegExp(Object.keys(mapObj).join('|'), 'g');
		return str.replace(re, (matched) => mapObj[matched] ?? matched);
	};

	const { isApproachingMaintenance } = useMaintenanceMessage();

	const formatMessage = () => {
		const maintenanceStartTimestamp = GetFeatureFlagByName(`MAINTENANCE_START_TIMESTAMP_${portalKey}`);
		const maintenanceEndTimestamp = GetFeatureFlagByName(`MAINTENANCE_END_TIMESTAMP_${portalKey}`);
		const impendingMessage = GetFeatureFlagByName(`MAINTENANCE_MSG_IMPENDING_${portalKey}`);
		const startTimestampStr = dayjs(maintenanceStartTimestamp).locale(displayConfig.locale).tz(displayConfig.timeZone).format(displayConfig.dateTimeFormat);
		const endTimestampStr = dayjs(maintenanceEndTimestamp).locale(displayConfig.locale).tz(displayConfig.timeZone).format(displayConfig.dateTimeFormat);
		const startDateStr = dayjs(maintenanceStartTimestamp).locale(displayConfig.locale).tz(displayConfig.timeZone).format(displayConfig.dateFormat);
		const endDateStr = dayjs(maintenanceEndTimestamp).locale(displayConfig.locale).tz(displayConfig.timeZone).format(displayConfig.dateFormat);
		const timeRangeStr = startDateStr === endDateStr ? startDateStr : `${startDateStr} - ${endDateStr}`;
		const mapObj = {
			'##startTimestampStr##': startTimestampStr,
			'##endTimestampStr##': endTimestampStr,
			'##timeRangeStr##': timeRangeStr,
		};
		return replaceTokens(impendingMessage, mapObj);
	};

	return (
		<>
			{props.isRootPage ? (
				<div data-testid="impending-message">
					<Alert message={<div>{parse(formatMessage())}</div>} />
				</div>
			) : (
				<div
					style={{ textAlign: 'left', position: 'fixed', top: isApproachingMaintenance ? displayConfig.approachingTop : displayConfig.impendingTop, zIndex: 1000 }}
					data-testid="impending-message"
				>
					<Alert message={<div>{parse(formatMessage())}</div>} />
				</div>
			)}
		</>
	);
};

export default ImpendingMessage;
