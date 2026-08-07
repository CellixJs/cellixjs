import { SectionLayout, type SectionLayoutProps } from './section-layout.tsx';

export const Root: React.FC<SectionLayoutProps> = ({ mode, onThemeChange }) => {
	return <SectionLayout mode={mode} onThemeChange={onThemeChange} />;
};
