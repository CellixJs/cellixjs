// Structural view of the Shaka Player UI build; only what VideoPlayer uses.
// Keeps Shaka's generated typings out of the public declaration output.

interface ShakaRequest {
	uris: string[];
}

export interface ShakaTextTrack {
	language: string;
	kind: string | null;
}

export interface ShakaPlayer {
	attach(mediaElement: HTMLMediaElement): Promise<unknown>;
	load(assetUri: string): Promise<unknown>;
	destroy(): Promise<unknown>;
	getNetworkingEngine(): {
		registerRequestFilter(filter: (type: number, request: ShakaRequest) => void): void;
	} | null;
	addEventListener(type: 'error', listener: (event: Event) => void): void;
	addTextTrackAsync(uri: string, language: string, kind: string, mimeType?: string, codec?: string, label?: string): Promise<ShakaTextTrack>;
	getTextTracks(): ShakaTextTrack[];
	/** Shows the given track; `null` hides captions. */
	selectTextTrack(track: ShakaTextTrack | null): void;
}

export interface ShakaOverlay {
	destroy(): Promise<unknown>;
	/** Applies UI settings; read on every key press, so changes take effect immediately. */
	configure(config: { enableKeyboardPlaybackControlsInWindow: boolean }): void;
}

interface ShakaModule {
	Player: {
		new (): ShakaPlayer;
		isBrowserSupported(): boolean;
	};
	polyfill: { installAll(): void };
	ui: {
		Overlay: new (player: ShakaPlayer, videoContainer: HTMLElement, video: HTMLMediaElement) => ShakaOverlay;
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
			return shaka;
		});
		// Allow a retry after a failed chunk load instead of caching the rejection.
		shakaPromise.catch(() => {
			shakaPromise = undefined;
		});
	}
	return shakaPromise;
}
