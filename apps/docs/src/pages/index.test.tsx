import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Home from './index';

describe('Home', () => {
  it('renders the homepage with title and tagline', () => {
    render(<Home />);
    
    // Check if the site title is rendered
    expect(screen.getByText('CellixJs Docs')).toBeInTheDocument();
    
    // Check if the tagline is rendered
    expect(screen.getByText('Domain-Driven Design for Modern Azure Applications')).toBeInTheDocument();
  });

  it('renders the call-to-action button', () => {
    render(<Home />);
    
    // Check if the CTA button is rendered
    const ctaButton = screen.getByText('CellixJs Doc - 15min ⏱️');
    expect(ctaButton).toBeInTheDocument();
    expect(ctaButton.closest('a')).toHaveAttribute('href', '/docs/intro');
  });

  it('renders the layout component', () => {
    render(<Home />);
    
    // Check if the layout is rendered
    const layout = screen.getByTestId('layout');
    expect(layout).toBeInTheDocument();
    expect(layout).toHaveAttribute('data-title', 'CellixJs Docs');
    expect(layout).toHaveAttribute('data-description', 'Description will go into a meta tag in <head />');
  });

  it('renders homepage features', () => {
    render(<Home />);
    
    // Check if HomepageFeatures component is rendered by checking for headings
    expect(screen.getByRole('heading', { name: 'Domain-Driven Design' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Enterprise-Ready Architecture' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Modern TypeScript Stack' })).toBeInTheDocument();
  });

  it('has proper header structure', () => {
    render(<Home />);
    
    // Check if header is rendered
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
    
    // Check if main section is rendered
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
  });

  it('renders the hero title as h1', () => {
    render(<Home />);
    
    // Check if the title is rendered as h1 specifically
    const h1Element = screen.getByRole('heading', { level: 1 });
    expect(h1Element).toBeInTheDocument();
    expect(h1Element).toHaveTextContent('CellixJs Docs');
  });
});
