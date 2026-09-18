import { Col, Result, Row } from 'antd';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';
import type { FC } from 'react';
import { useFeatureFlags } from '../feature-flag/index.tsx';
import type { MaintenanceMessageDisplayConfig } from './maintenance-message-config.ts';
import parse from './parse-html.ts';

dayjs.extend(utc);
dayjs.extend(timezone);

interface MaintenanceMessageProps {
	portalKey: string;
	displayConfig: MaintenanceMessageDisplayConfig;
}

/**
 * Renders a portal's maintenance template as a warning page.
 * @param props - Explicit portal identity and application-owned date formatting.
 * @returns The existing warning layout with date tokens replaced in the configured HTML template.
 * @remarks The application decides which routes to replace. Templates are parsed, not sanitized;
 * use trusted configuration. Invalid timezone settings may throw during formatting.
 * @example
 * ```tsx
 * <MaintenanceMessage portalKey="CUSTOMER" displayConfig={displayConfig} />
 * ```
 */
const MaintenanceMessage: FC<MaintenanceMessageProps> = ({ portalKey, displayConfig }) => {
	const { GetFeatureFlagByName } = useFeatureFlags();
	const replaceTokens = (str: string, mapObj: Record<string, string>) => {
		const re = new RegExp(Object.keys(mapObj).join('|'), 'g');
		return str.replace(re, (matched) => mapObj[matched] ?? matched);
	};

	const getMessage = () => {
		const maintenanceMessage = GetFeatureFlagByName(`MAINTENANCE_MSG_SYSTEM_${portalKey}`);
		const maintenanceStartTimestamp = GetFeatureFlagByName(`MAINTENANCE_START_TIMESTAMP_${portalKey}`);
		const maintenanceEndTimestamp = GetFeatureFlagByName(`MAINTENANCE_END_TIMESTAMP_${portalKey}`);
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
		return replaceTokens(maintenanceMessage, mapObj);
	};

	return (
		<div data-testid="maintenance-message">
			<Row>
				<Col span={24}>
					<Result
						status="warning"
						title={''}
					></Result>
				</Col>
			</Row>
			<div style={{ textAlign: 'center' }}>
				<div style={{ maxWidth: '400px', display: 'inline-block' }}>{parse(getMessage() ?? '')}</div>
			</div>
		</div>
	);
};

export default MaintenanceMessage;
