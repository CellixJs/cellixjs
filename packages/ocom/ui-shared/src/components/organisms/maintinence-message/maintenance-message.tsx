import { Col, Result, Row } from 'antd';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';
import type { FC } from 'react';
import { useFeatureFlags } from '../feature-flag/index.tsx';
import parse from './parse-html.ts';
import 'dayjs/locale/en';

dayjs.locale('en');
dayjs.extend(utc);
dayjs.extend(timezone);

interface MaintenanceMessageProps {
	portalKey?: string;
}

const MaintenanceMessage: FC<MaintenanceMessageProps> = ({ portalKey = 'UI_STAFF_PORTAL' }) => {
	const { GetFeatureFlagByName } = useFeatureFlags();
	const replaceTokens = (str: string, mapObj: Record<string, string>) => {
		const re = new RegExp(Object.keys(mapObj).join('|'), 'g');
		return str.replace(re, (matched) => mapObj[matched] ?? matched);
	};

	const getMessage = () => {
		const maintenanceMessage = GetFeatureFlagByName(`MAINTENANCE_MSG_SYSTEM_${portalKey}`);
		const maintenanceStartTimestamp = GetFeatureFlagByName(`MAINTENANCE_START_TIMESTAMP_${portalKey}`);
		const maintenanceEndTimestamp = GetFeatureFlagByName(`MAINTENANCE_END_TIMESTAMP_${portalKey}`);
		const startTimestampStr = dayjs(maintenanceStartTimestamp).tz('America/New_York').format('h:mm a on dddd, MMMM DD, YYYY');
		const endTimestampStr = dayjs(maintenanceEndTimestamp).tz('America/New_York').format('h:mm a on dddd, MMMM DD, YYYY');
		const startDateStr = dayjs(maintenanceStartTimestamp).tz('America/New_York').format('MMMM DD');
		const endDateStr = dayjs(maintenanceEndTimestamp).tz('America/New_York').format('MMMM DD');
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
