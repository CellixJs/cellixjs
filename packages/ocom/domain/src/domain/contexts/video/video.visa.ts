import type { Visa } from '@cellix/domain-seedwork/visa';
import type { VideoDomainPermissions } from './video.domain-permissions.ts';

export interface VideoVisa extends Visa<VideoDomainPermissions> {
	determineIf(func: (permissions: Readonly<VideoDomainPermissions>) => boolean): boolean;
}
