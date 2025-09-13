import '@testing-library/jest-dom';
import React from 'react';
import { vi } from 'vitest';

// Make React available globally for JSX
global.React = React;

// Mock SVG imports
const mockSvg = (props: React.SVGProps<SVGSVGElement>) => 
  React.createElement('svg', { ...props, 'data-testid': 'mock-svg' });

// Mock module imports - need to match the actual path patterns
vi.mock('@site/static/img/undraw_docusaurus_mountain.svg', () => ({
  default: mockSvg,
}));

vi.mock('@site/static/img/undraw_docusaurus_tree.svg', () => ({
  default: mockSvg,
}));

vi.mock('@site/static/img/undraw_docusaurus_react.svg', () => ({
  default: mockSvg,
}));

vi.mock('*.svg', () => ({
  default: mockSvg,
  ReactComponent: mockSvg,
}));

vi.mock('*.module.css', () => ({}));
vi.mock('*.css', () => ({}));
