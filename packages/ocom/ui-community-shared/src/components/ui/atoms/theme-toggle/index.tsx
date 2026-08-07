import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { Switch } from 'antd';

export interface ThemeToggleProps {
	checked?: boolean;
	onChange?: ((checked: boolean) => void) | undefined;
	className?: string | undefined;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ checked = false, onChange = () => undefined, className }) => {
	return (
		<Switch
			classNames={{ root: className ?? '' }}
			checked={checked}
			onChange={onChange}
			checkedChildren={<MoonOutlined />}
			unCheckedChildren={<SunOutlined />}
			aria-label="Toggle dark mode"
		/>
	);
}
