import { createContext, type ReactNode } from 'react';

const ThemeContext = createContext({});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
	return <ThemeContext.Provider value={{}}>{children}</ThemeContext.Provider>;
};
