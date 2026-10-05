import type { VideoEntityReference } from '../../../../contexts/video/video/index.ts';
import type { VideoPassport } from '../../../../contexts/video/video.passport.ts';
import type { VideoVisa } from '../../../../contexts/video/video.visa.ts';
import { StaffUserPassportBase } from '../../staff-user.passport-base.ts';

/** Staff users have no video permissions yet; community videos are managed by members. */
export class StaffUserVideoPassport extends StaffUserPassportBase implements VideoPassport {
	forVideo(_root: VideoEntityReference): VideoVisa {
		return { determineIf: () => false };
	}
}
