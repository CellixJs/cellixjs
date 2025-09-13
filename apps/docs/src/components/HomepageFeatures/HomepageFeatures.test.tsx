import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import HomepageFeatures from '../HomepageFeatures';

describe('HomepageFeatures', () => {
  it('renders all feature items', () => {
    render(<HomepageFeatures />);
    
    // Check if all three features are rendered as headings
    expect(screen.getByRole('heading', { name: 'Domain-Driven Design' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Enterprise-Ready Architecture' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Modern TypeScript Stack' })).toBeInTheDocument();
  });

  it('renders feature descriptions', () => {
    render(<HomepageFeatures />);
    
    // Check for specific text in descriptions
    expect(screen.getByText(/CellixJs implements sophisticated DDD patterns/)).toBeInTheDocument();
    expect(screen.getByText(/Focus on your business domains/)).toBeInTheDocument();
    expect(screen.getByText(/Full-stack TypeScript monorepo/)).toBeInTheDocument();
  });

  it('renders SVG images for each feature', () => {
    render(<HomepageFeatures />);
    
    // Check if mock SVGs are rendered
    const svgs = screen.getAllByTestId('mock-svg');
    expect(svgs).toHaveLength(3);
  });

  it('has proper CSS structure', () => {
    render(<HomepageFeatures />);
    
    // Check if the main section is rendered by looking for container and row using heading
    const heading = screen.getByRole('heading', { name: 'Domain-Driven Design' });
    const container = heading.closest('.container');
    expect(container).toBeInTheDocument();
    
    const row = container?.querySelector('.row');
    expect(row).toBeInTheDocument();
    
    // Verify the section element exists
    const section = container?.closest('section');
    expect(section).toBeInTheDocument();
  });

  it('renders headings with correct hierarchy', () => {
    render(<HomepageFeatures />);
    
    // Check if all h3 headings are rendered
    const headings = screen.getAllByTestId('heading');
    expect(headings).toHaveLength(3);
  });
});
