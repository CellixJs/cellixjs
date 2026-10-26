import type { ShakaAudioTrack, ShakaControls, ShakaPlayer } from './shaka-loader.ts';

/** Name the audio description button is registered under in the Shaka control panel. */
export const AUDIO_DESCRIPTION_ELEMENT = 'cellix_audio_description';

/** Player events after which the active or available audio tracks may have changed. */
export const AUDIO_TRACK_EVENTS = ['loaded', 'trackschanged', 'variantchanged', 'audiotrackschanged'] as const;

/**
 * Whether a track is audio description: marked "visually impaired" by DASH
 * (AudioPurposeCS value 1) or HLS (`public.accessibility.describes-video`), or
 * given the DASH `description` role.
 */
function isAudioDescription(track: ShakaAudioTrack): boolean {
	return track.accessibilityPurpose === 'visually impaired' || track.roles.includes('description') || track.roles.includes('public.accessibility.describes-video');
}

function findAudioDescription(player: ShakaPlayer): ShakaAudioTrack | undefined {
	return player.getAudioTracks().find(isAudioDescription);
}

/** Whether the loaded video offers an audio description track. */
function hasAudioDescription(player: ShakaPlayer): boolean {
	return findAudioDescription(player) !== undefined;
}

/** Whether the audio description track is the one playing. */
export function isAudioDescriptionActive(player: ShakaPlayer): boolean {
	return findAudioDescription(player)?.active === true;
}

/**
 * Switches between the audio description and the regular soundtrack in the
 * same language, without restarting playback. Does nothing when the video has
 * no audio description.
 */
export function setAudioDescription(player: ShakaPlayer, enabled: boolean): void {
	const tracks = player.getAudioTracks();
	const described = tracks.find(isAudioDescription);
	if (!described) return;
	const regular = tracks.filter((track) => !isAudioDescription(track));
	const target = enabled ? described : (regular.find((track) => track.language === described.language) ?? regular[0]);
	if (target && !target.active) player.selectAudioTrack(target);
}

/** Inserts the audio description button before fullscreen, or at the end of the control panel. */
export function withAudioDescriptionButton(elements: readonly string[]): string[] {
	if (elements.includes(AUDIO_DESCRIPTION_ELEMENT)) return [...elements];
	const fullscreen = elements.indexOf('fullscreen');
	return fullscreen === -1 ? [...elements, AUDIO_DESCRIPTION_ELEMENT] : [...elements.slice(0, fullscreen), AUDIO_DESCRIPTION_ELEMENT, ...elements.slice(fullscreen)];
}

/**
 * Shaka control panel element: an "AD" toggle button, hidden unless the video
 * has an audio description. It reads and switches the player's audio tracks
 * directly, so it stays correct however the track changes.
 */
export const audioDescriptionButtonFactory = {
	create(rootElement: HTMLElement, controls: ShakaControls) {
		const player = controls.getPlayer();
		const button = document.createElement('button');
		button.type = 'button';
		button.className = 'shaka-tooltip cellix-audio-description-button';
		button.setAttribute('aria-label', 'Audio description');
		button.textContent = 'AD';
		Object.assign(button.style, { fontWeight: '700', fontSize: '14px', fontFamily: 'inherit', letterSpacing: '0.5px' });

		const update = () => {
			const available = player ? hasAudioDescription(player) : false;
			const active = available && player ? isAudioDescriptionActive(player) : false;
			button.hidden = !available;
			button.setAttribute('aria-pressed', String(active));
			// The pressed state is also shown without colour: an underline under "AD".
			button.style.textDecoration = active ? 'underline' : 'none';
			button.style.textUnderlineOffset = '4px';
			button.style.textDecorationThickness = '2px';
		};
		const onClick = () => {
			if (player) setAudioDescription(player, !isAudioDescriptionActive(player));
			update();
		};

		button.addEventListener('click', onClick);
		for (const type of AUDIO_TRACK_EVENTS) player?.addEventListener(type, update);
		update();
		rootElement.appendChild(button);

		return {
			release() {
				button.removeEventListener('click', onClick);
				for (const type of AUDIO_TRACK_EVENTS) player?.removeEventListener(type, update);
				button.remove();
			},
		};
	},
};
