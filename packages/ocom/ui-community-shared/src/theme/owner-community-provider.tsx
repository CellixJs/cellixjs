import { ConfigProvider, theme as antdTheme } from 'antd';
import type { ReactNode } from 'react';
import { getAntDesignTheme, type OwnerCommunityThemeMode } from './tokens.ts';

export interface OwnerCommunityProviderProps {
	children: ReactNode;
	mode: OwnerCommunityThemeMode;
}

export const OwnerCommunityProvider: React.FC<OwnerCommunityProviderProps> = ({ children, mode }) => {
	const algorithm = mode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm;
	const baseTheme = getAntDesignTheme(mode);

	return (
		<div data-owner-community-theme={mode}>
			<ConfigProvider
				theme={{
					...baseTheme,
					algorithm,
				}}
			>
				{children}
			</ConfigProvider>
		</div>
	);
};
