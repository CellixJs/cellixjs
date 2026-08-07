import { loadStoredTheme, saveStoredTheme } from '@cellix/ui-core';
import { type OwnerCommunityThemeMode, themeModes } from '@ocom/ui-community-shared';
import { createContext, type ReactNode, useCallback, useEffect, useState } from 'react';

export interface ThemeContextType {
	mode: OwnerCommunityThemeMode;
	toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
	mode: themeModes.light,
	toggleTheme: () => {
		/* no-op */
	},
});

const THEME_STORAGE_KEY = 'owner-community-theme';

const loadStoredMode = (): OwnerCommunityThemeMode => {
	try {
		const stored = localStorage.getItem(THEME_STORAGE_KEY);
		if (stored === 'dark') {
			return 'dark';
		}
		return 'light';
	} catch {
		return 'light';
	}
};

const saveStoredMode = (mode: OwnerCommunityThemeMode): void => {
	try {
		localStorage.setItem(THEME_STORAGE_KEY, mode);
		// Keep the legacy theme storage in sync so other consumers that read it are not broken.
		saveStoredTheme({ type: mode });
	} catch {
		// ignore storage errors
	}
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
	const [mode, setMode] = useState<OwnerCommunityThemeMode>(() => {
		const legacy = loadStoredTheme();
		if (legacy?.type === 'dark' || legacy?.type === 'light') {
			return legacy.type;
		}
		return loadStoredMode();
	});

	useEffect(() => {
		saveStoredMode(mode);
	}, [mode]);

	const toggleTheme = useCallback(() => {
		setMode((prev) => (prev === themeModes.dark ? themeModes.light : themeModes.dark));
	}, []);

	return <ThemeContext.Provider value={{ mode, toggleTheme }}>{children}</ThemeContext.Provider>;
};
