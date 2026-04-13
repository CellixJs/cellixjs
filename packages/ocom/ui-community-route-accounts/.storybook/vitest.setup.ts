import * as a11yAddonAnnotations from '@storybook/addon-a11y/preview';
import { setProjectAnnotations } from '@storybook/react-vite';
import * as projectAnnotations from './preview.tsx';

// This is an important step to apply the right configuration when testing your stories.
setProjectAnnotations([a11yAddonAnnotations, projectAnnotations]);

