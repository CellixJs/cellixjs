import '@testing-library/jest-dom';

// Load Storybook helpers dynamically to avoid static ESM/CJS interop parsing
// issues when vitest imports setup files. Using top-level await ensures the
// modules (including TSX preview files) are compiled by the test runner.
const a11yAddonAnnotations = await import('@storybook/addon-a11y/preview');
const { setProjectAnnotations } = await import('@storybook/react-vite');
const projectAnnotations = await import('./preview.tsx');

// Apply project annotations so Storybook stories render under Vitest.
setProjectAnnotations([a11yAddonAnnotations, projectAnnotations]);
