import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { ThemeProvider, ThemeContext } from './theme-context';

describe('ThemeContext', () => {
	it('provides currentTokens and setTheme without throwing', () => {
		const Consumer = () => {
			const ctx = React.useContext(ThemeContext as unknown as { currentTokens?: { type?: string } });
			return React.createElement('div', {}, ctx?.currentTokens?.type || 'no-type');
		};

		const html = renderToString(
			React.createElement(ThemeProvider, {}, React.createElement(Consumer)),
		);
		expect(typeof html).toBe('string');
		expect(html.length).toBeGreaterThan(0);
		expect(html).toContain('light');
	});
});
