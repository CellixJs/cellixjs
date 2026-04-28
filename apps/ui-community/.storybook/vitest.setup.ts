import '@testing-library/jest-dom';

import * as a11yAddonAnnotations from '@storybook/addon-a11y/preview';
import { setProjectAnnotations } from '@storybook/react-vite';
import * as projectAnnotations from './preview.tsx';

// Apply project annotations so Storybook stories render under Vitest.
setProjectAnnotations([a11yAddonAnnotations, projectAnnotations]);
