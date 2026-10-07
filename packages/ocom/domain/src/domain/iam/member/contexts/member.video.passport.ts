import type { VideoEntityReference } from '../../../contexts/video/video/index.ts';
import type { VideoPassport } from '../../../contexts/video/video.passport.ts';
import type { VideoVisa } from '../../../contexts/video/video.visa.ts';
import type { VideoViewingEntityReference } from '../../../contexts/video/video-viewing/index.ts';
import { MemberPassportBase } from '../member.passport-base.ts';
import { MemberVideoVisa } from './member.video.visa.ts';
import { MemberVideoViewingVisa } from './member.video-viewing.visa.ts';

export class MemberVideoPassport extends MemberPassportBase implements VideoPassport {
	forVideo(root: VideoEntityReference): VideoVisa {
		return new MemberVideoVisa(root, this._member);
	}

	forVideoViewing(root: VideoViewingEntityReference): VideoVisa {
		return new MemberVideoViewingVisa(root, this._member);
	}
}
