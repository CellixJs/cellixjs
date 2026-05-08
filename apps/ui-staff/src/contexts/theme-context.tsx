import { loadStoredTheme, type StoredTheme, saveStoredTheme } from '@cellix/ui-core';
import { Button, theme } from 'antd';
import type { SeedToken } from 'antd/lib/theme/interface/index.js';
import { createContext, type ReactNode, useCallback, useEffect, useState } from 'react';

interface ThemeContextType {
	currentTokens:
		| {
				token: Partial<SeedToken>;
				hardCodedTokens: {
					textColor: string | undefined;
					backgroundColor: string | undefined;
				};
				type: StoredTheme['type'];
		  }
		| undefined;
	setTheme: (tokens: Partial<SeedToken>, type: string) => void;
}

export const ThemeContext = createContext<ThemeContextType>({
	currentTokens: {
		token: theme.defaultSeed,
		hardCodedTokens: {
			textColor: '#000000',
			backgroundColor: '#ffffff',
		},
		type: 'light',
	},
	setTheme: () => {
		/* no-op */
	},
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
	const [currentTokens, setCurrentTokens] = useState<ThemeContextType['currentTokens'] | undefined>({
		token: theme.defaultSeed,
		hardCodedTokens: {
			textColor: '#000000',
			backgroundColor: '#ffffff',
		},
		type: 'light',
	});
	const [isHidden, setIsHidden] = useState(false);

	const toggleHidden = useCallback(() => setIsHidden((prevHidden) => !prevHidden), []);

	const setTheme = useCallback((tokens: Partial<SeedToken>, type: string) => {
		setCurrentTokens((prevTokens) => {
			let valueToSet: ThemeContextType['currentTokens'] | undefined;
			if (type === 'light') {
				valueToSet = {
					token: tokens,
					hardCodedTokens: {
						textColor: '#000000',
						backgroundColor: '#ffffff',
					},
					type: 'light',
				};
			} else if (type === 'dark') {
				valueToSet = {
					token: tokens,
					hardCodedTokens: {
						textColor: '#ffffff',
						backgroundColor: '#000000',
					},
					type: 'dark',
				};
			} else if (type === 'custom') {
				valueToSet = {
					token: {
						...prevTokens?.token,
					},
					hardCodedTokens: {
						textColor: tokens?.colorTextBase,
						backgroundColor: tokens?.colorBgBase,
					},
					type: 'custom',
				};
			}
			// Guard localStorage access in case this is executed during SSR / non-browser envs
			if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis && typeof globalThis.localStorage !== 'undefined') {
				try {
					globalThis.localStorage.setItem('themeProp', JSON.stringify(valueToSet));
				} catch (_err) {
					// Ignore localStorage errors
				}
			}
			return valueToSet;
		});
	}, []);

	useEffect(() => {
		let extractFromLocal: {
			type?: string;
			hardCodedTokens?: {
				textColor?: string;
				backgroundColor?: string;
			};
		} = {};
		// Guard localStorage access in case this is executed during SSR / non-browser envs
		if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis && typeof globalThis.localStorage !== 'undefined') {
			try {
				extractFromLocal = JSON.parse(globalThis.localStorage.getItem('themeProp') || '{}');
			} catch {
				try {
					globalThis.localStorage.removeItem('themeProp');
				} catch (_err) {
					// Ignore localStorage errors
				}
			}
		} else {
			extractFromLocal = {};
		}
		if (extractFromLocal && extractFromLocal.type === 'dark') {
			setTheme(
				{
					colorTextBase: '#ffffff',
					colorBgBase: '#000000',
				},
				'dark',
			);
			return;
		} else if (extractFromLocal && extractFromLocal.type === 'light') {
			setTheme(
				{
					colorTextBase: '#000000',
					colorBgBase: '#ffffff',
				},
				'light',
			);
			return;
		} else if (extractFromLocal && extractFromLocal.type === 'custom') {
			setTheme(
				{
					colorTextBase: extractFromLocal.hardCodedTokens?.textColor,
					colorBgBase: extractFromLocal.hardCodedTokens?.backgroundColor,
				},
				'custom',
			);
			return;
		} else {
			const valueToSet = {
				type: 'light',
				token: theme.defaultSeed,
				hardCodedTokens: {
					textColor: '#000000',
					backgroundColor: '#ffffff',
				},
			};
			// Guard localStorage access when not in browser
			if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis && typeof globalThis.localStorage !== 'undefined') {
				try {
					globalThis.localStorage.setItem('themeProp', JSON.stringify(valueToSet));
				} catch (_err) {
					// Ignore localStorage errors
				}
			}
			setTheme(theme.defaultSeed, 'light');
			return;
		}
	}, [setTheme]);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.metaKey && event.shiftKey && event.key === 'k') {
				toggleHidden();
			}
		};

		// Guard globalThis event listener registration in non-browser envs
		if (typeof globalThis !== 'undefined' && typeof globalThis.addEventListener !== 'undefined') {
			globalThis.addEventListener('keydown', handleKeyDown);

			return () => {
				try {
					globalThis.removeEventListener('keydown', handleKeyDown);
				} catch (_err) {
					// Ignore
				}
			};
		}

		return () => {
			/* no-op */
		};
	}, [toggleHidden]);

	return (
		<ThemeContext.Provider value={{ currentTokens, setTheme }}>
			<div>
				<div className={isHidden ? 'hidden' : 'text-center'}>
					<div style={{ display: 'flex', justifyContent: 'center', width: '100%', padding: '8px 0' }}>
						<Button
							type="primary"
							onClick={() => {
								if (currentTokens?.type === 'custom' || currentTokens?.type === 'light') {
									setTheme(theme.darkAlgorithm(theme.defaultSeed), 'dark');
								} else if (currentTokens?.type === 'dark') {
									setTheme(theme.defaultSeed, 'light');
								}
							}}
						>
							Toggle Dark/Light
						</Button>
					</div>
					<p style={{ textAlign: 'center', margin: 0, paddingBottom: 8 }}>
						Hit <strong>Cmd+Shift+K</strong> to hide
					</p>
				</div>
				{children}
			</div>
		</ThemeContext.Provider>
	);
};
