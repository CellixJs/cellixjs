import { Alert } from 'antd';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';
import type { FC } from 'react';
import { useFeatureFlags } from '../feature-flag/index.tsx';
import parse from './parse-html.ts';
import useMaintenanceMessage from './use-maintenance-message.tsx';
import 'dayjs/locale/en';

dayjs.locale('en');
dayjs.extend(utc);
dayjs.extend(timezone);

interface ImpendingMessageProps {
	isRootPage?: boolean;
	portalKey?: string;
}

const ImpendingMessage: FC<ImpendingMessageProps> = (props) => {
	const portalKey = props.portalKey ?? 'UI_STAFF_PORTAL';
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
		const startTimestampStr = dayjs(maintenanceStartTimestamp).locale('en').tz('America/New_York').format('h:mm a on dddd, MMMM DD, YYYY');
		const endTimestampStr = dayjs(maintenanceEndTimestamp).locale('en').tz('America/New_York').format('h:mm a on dddd, MMMM DD, YYYY');
		const startDateStr = dayjs(maintenanceStartTimestamp).locale('en').tz('America/New_York').format('MMMM DD');
		const endDateStr = dayjs(maintenanceEndTimestamp).locale('en').tz('America/New_York').format('MMMM DD');
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
					style={{ textAlign: 'left', position: 'fixed', top: isApproachingMaintenance ? '100px' : '60px', zIndex: 1000 }}
					data-testid="impending-message"
				>
					<Alert message={<div>{parse(formatMessage())}</div>} />
				</div>
			)}
		</>
	);
};

export default ImpendingMessage;
