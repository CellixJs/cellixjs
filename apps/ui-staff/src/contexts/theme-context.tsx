import { createContext, type ReactNode } from 'react';

export const ThemeContext = createContext({});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
	return <ThemeContext.Provider value={{}}>{children}</ThemeContext.Provider>;
};
