import type { VideoEntityReference } from '../../../contexts/video/video/index.ts';
import type { VideoDomainPermissions } from '../../../contexts/video/video.domain-permissions.ts';
import type { VideoPassport } from '../../../contexts/video/video.passport.ts';
import type { VideoVisa } from '../../../contexts/video/video.visa.ts';
import type { VideoViewingEntityReference } from '../../../contexts/video/video-viewing/index.ts';
import { SystemPassportBase } from '../system.passport-base.ts';

export class SystemVideoPassport extends SystemPassportBase implements VideoPassport {
	forVideo(_root: VideoEntityReference): VideoVisa {
		const permissions = this.permissions as VideoDomainPermissions;
		return { determineIf: (func) => func(permissions) };
	}

	forVideoViewing(_root: VideoViewingEntityReference): VideoVisa {
		const permissions = this.permissions as VideoDomainPermissions;
		return { determineIf: (func) => func(permissions) };
	}
}
