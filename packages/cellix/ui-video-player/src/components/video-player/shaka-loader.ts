// Structural view of the Shaka Player UI build; only what VideoPlayer uses.
// Keeps Shaka's generated typings out of the public declaration output.
import { AUDIO_DESCRIPTION_ELEMENT, audioDescriptionButtonFactory } from './audio-description.ts';

interface ShakaRequest {
	uris: string[];
}

export interface ShakaTextTrack {
	language: string;
	kind: string | null;
}

export interface ShakaAudioTrack {
	active: boolean;
	language: string;
	roles: string[];
	/** `'visually impaired'` for audio description. */
	accessibilityPurpose: string | null;
}

type ShakaPlayerEvent = 'error' | 'loaded' | 'trackschanged' | 'variantchanged' | 'audiotrackschanged';

export interface ShakaPlayer {
	attach(mediaElement: HTMLMediaElement): Promise<unknown>;
	load(assetUri: string): Promise<unknown>;
	destroy(): Promise<unknown>;
	getNetworkingEngine(): {
		registerRequestFilter(filter: (type: number, request: ShakaRequest) => void): void;
	} | null;
	addEventListener(type: ShakaPlayerEvent, listener: (event: Event) => void): void;
	removeEventListener(type: ShakaPlayerEvent, listener: (event: Event) => void): void;
	getAudioTracks(): ShakaAudioTrack[];
	/** Switches audio without restarting playback. */
	selectAudioTrack(track: ShakaAudioTrack): void;
	addTextTrackAsync(uri: string, language: string, kind: string, mimeType?: string, codec?: string, label?: string): Promise<ShakaTextTrack>;
	getTextTracks(): ShakaTextTrack[];
	/** Shows the given track; `null` hides captions. */
	selectTextTrack(track: ShakaTextTrack | null): void;
}

export interface ShakaOverlay {
	destroy(): Promise<unknown>;
	/** Applies UI settings; read on every key press, so changes take effect immediately. */
	configure(config: { enableKeyboardPlaybackControlsInWindow?: boolean; controlPanelElements?: string[] }): void;
	getConfiguration(): { controlPanelElements: string[] };
}

export interface ShakaControls {
	getPlayer(): ShakaPlayer | null;
}

interface ShakaUIElementFactory {
	create(rootElement: HTMLElement, controls: ShakaControls): { release(): void };
}

interface ShakaModule {
	Player: {
		new (): ShakaPlayer;
		isBrowserSupported(): boolean;
	};
	polyfill: { installAll(): void };
	ui: {
		Overlay: new (player: ShakaPlayer, videoContainer: HTMLElement, video: HTMLMediaElement) => ShakaOverlay;
		Controls: { registerElement(name: string, factory: ShakaUIElementFactory): void };
	};
}

let shakaPromise: Promise<ShakaModule> | undefined;

/**
 * Lazily loads Shaka Player and its UI stylesheet so applications only pay for
 * them on pages that render a video. Polyfills are installed once.
 */
export function loadShaka(): Promise<ShakaModule> {
	if (!shakaPromise) {
		shakaPromise = Promise.all([import('shaka-player/dist/shaka-player.ui.js'), import('shaka-player/dist/controls.css')]).then(([module]) => {
			const shaka = module.default as unknown as ShakaModule;
			shaka.polyfill.installAll();
			shaka.ui.Controls.registerElement(AUDIO_DESCRIPTION_ELEMENT, audioDescriptionButtonFactory);
			return shaka;
		});
		// Allow a retry after a failed chunk load instead of caching the rejection.
		shakaPromise.catch(() => {
			shakaPromise = undefined;
		});
	}
	return shakaPromise;
}
