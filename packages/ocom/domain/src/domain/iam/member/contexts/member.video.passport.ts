import type { VideoEntityReference } from '../../../contexts/video/video/index.ts';
import type { VideoPassport } from '../../../contexts/video/video.passport.ts';
import type { VideoVisa } from '../../../contexts/video/video.visa.ts';
import { MemberPassportBase } from '../member.passport-base.ts';
import { MemberVideoVisa } from './member.video.visa.ts';

export class MemberVideoPassport extends MemberPassportBase implements VideoPassport {
	forVideo(root: VideoEntityReference): VideoVisa {
		return new MemberVideoVisa(root, this._member);
	}
}
