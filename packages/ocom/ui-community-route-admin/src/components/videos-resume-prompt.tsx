import { Button, Space, Typography } from 'antd';
import { useId } from 'react';
import { formatDuration } from './videos-list.tsx';

const { Text } = Typography;

interface VideosResumePromptProps {
	/** Where the member stopped, in seconds. */
	resumeAt: number;
	onResume: () => void;
	onStartOver: () => void;
}

/**
 * Asks a member who stopped part way through whether to pick up where they
 * left off. It covers the video it is placed over, so the member chooses
 * before playback starts. Escape starts over.
 */
export const VideosResumePrompt: React.FC<VideosResumePromptProps> = ({ resumeAt, onResume, onStartOver }) => {
	const labelId = useId();
	const time = formatDuration(resumeAt);
	return (
		<div
			role="dialog"
			aria-labelledby={labelId}
			onKeyDown={(event) => {
				if (event.key === 'Escape') {
					onStartOver();
				}
			}}
			style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.6)' }}
		>
			<Space
				orientation="vertical"
				align="center"
				style={{ background: '#fff', padding: '16px 24px', borderRadius: 8 }}
			>
				<Text
					id={labelId}
					strong
				>
					You stopped at {time}.
				</Text>
				<Space wrap>
					<Button
						type="primary"
						autoFocus
						onClick={onResume}
					>
						Resume from {time}
					</Button>
					<Button onClick={onStartOver}>Start over</Button>
				</Space>
			</Space>
		</div>
	);
};
