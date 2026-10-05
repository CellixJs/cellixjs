import type { VideoEntityReference } from '../../../contexts/video/video/index.ts';
import type { VideoPassport } from '../../../contexts/video/video.passport.ts';
import type { VideoVisa } from '../../../contexts/video/video.visa.ts';
import { GuestPassportBase } from '../guest.passport-base.ts';

export class GuestVideoPassport extends GuestPassportBase implements VideoPassport {
	forVideo(_root: VideoEntityReference): VideoVisa {
		return { determineIf: () => false };
	}
}
