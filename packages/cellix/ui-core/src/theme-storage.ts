export type StoredTheme = {
	type?: 'light' | 'dark' | 'custom';
	hardCodedTokens?: { textColor?: string; backgroundColor?: string };
	token?: unknown;
};

const THEME_STORAGE_KEY = 'themeProp';

export function loadStoredTheme(): StoredTheme {
	try {
		return JSON.parse(localStorage.getItem(THEME_STORAGE_KEY) ?? '{}') as StoredTheme;
	} catch {
		localStorage.removeItem(THEME_STORAGE_KEY);
		return {};
	}
}

export function saveStoredTheme(value: StoredTheme): void {
	localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(value));
}
