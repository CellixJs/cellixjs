import type { VideoEntityReference } from '../../../../contexts/video/video/index.ts';
import type { VideoPassport } from '../../../../contexts/video/video.passport.ts';
import type { VideoVisa } from '../../../../contexts/video/video.visa.ts';
import { StaffUserPassportBase } from '../../staff-user.passport-base.ts';
import { StaffUserVideoVisa } from './staff-user.video.visa.ts';

export class StaffUserVideoPassport extends StaffUserPassportBase implements VideoPassport {
	forVideo(root: VideoEntityReference): VideoVisa {
		return new StaffUserVideoVisa(root, this._user);
	}
}
