import type { EncodedRendition } from './interfaces.ts';
import type { SourceInfo } from './probe-source.ts';

const SEGMENT_DURATION_SECONDS = 2;
const AUDIO_BITRATE_KBPS = 128;

/** Default ladder. `shortSide` is the height for landscape video and the width for portrait video. */
const DEFAULT_LADDER = [
	{ shortSide: 1080, videoBitrateKbps: 5000 },
	{ shortSide: 720, videoBitrateKbps: 2800 },
	{ shortSide: 480, videoBitrateKbps: 1400 },
	{ shortSide: 360, videoBitrateKbps: 800 },
] as const;

interface PlannedRendition extends EncodedRendition {
	/** Used for intermediate and output paths, e.g. `video/720/`. */
	name: string;
}

interface PlannedTextTrack {
	subtitleIndex: number;
	language: string;
	name: string;
}

export interface EncodingPlan {
	renditions: PlannedRendition[];
	hasAudio: boolean;
	textTracks: PlannedTextTrack[];
}

export function planEncoding(source: SourceInfo): EncodingPlan {
	return {
		renditions: planRenditions(source.width, source.height),
		hasAudio: source.hasAudio,
		textTracks: source.textSubtitles.map((subtitle, index) => ({ ...subtitle, name: String(index) })),
	};
}

/** Keeps the rungs no larger than the source; a source below the lowest rung gets one rung at its own size. */
function planRenditions(width: number, height: number): PlannedRendition[] {
	const sourceShortSide = Math.min(width, height);
	const rungs = DEFAULT_LADDER.filter((rung) => rung.shortSide <= sourceShortSide);
	const selected = rungs.length > 0 ? rungs : [{ shortSide: toEven(sourceShortSide, Math.floor), videoBitrateKbps: DEFAULT_LADDER.at(-1)?.videoBitrateKbps ?? 800 }];

	return selected.map(({ shortSide, videoBitrateKbps }) => {
		const longSide = toEven((Math.max(width, height) * shortSide) / sourceShortSide, Math.round);
		const landscape = width >= height;
		return {
			name: String(shortSide),
			width: landscape ? longSide : shortSide,
			height: landscape ? shortSide : longSide,
			videoBitrateKbps,
		};
	});
}

/** H.264 with 4:2:0 chroma needs even dimensions. */
function toEven(value: number, round: (value: number) => number): number {
	return Math.max(2, round(value / 2) * 2);
}

export function ffmpegEncodeArgs(sourcePath: string, encodedDir: string, plan: EncodingPlan): string[] {
	const { renditions } = plan;
	const scaled = renditions.map((rendition, index) => `scale=${rendition.width}:${rendition.height},setsar=1[v${index}]`);
	const filter = renditions.length === 1 ? `[0:v:0]${scaled[0]}` : `[0:v:0]split=${renditions.length}${renditions.map((_, index) => `[s${index}]`).join('')};${scaled.map((chain, index) => `[s${index}]${chain}`).join(';')}`;

	const videoOutputs = renditions.flatMap((rendition, index) => [
		'-map',
		`[v${index}]`,
		'-an',
		'-sn',
		'-dn',
		'-c:v',
		'libx264',
		'-preset',
		'medium',
		'-profile:v',
		'high',
		'-pix_fmt',
		'yuv420p',
		'-b:v',
		`${rendition.videoBitrateKbps}k`,
		'-maxrate',
		`${Math.round(rendition.videoBitrateKbps * 1.07)}k`,
		'-bufsize',
		`${Math.round(rendition.videoBitrateKbps * 1.5)}k`,
		'-force_key_frames',
		`expr:gte(t,n_forced*${SEGMENT_DURATION_SECONDS})`,
		'-sc_threshold',
		'0',
		`${encodedDir}/video_${rendition.name}.mp4`,
	]);

	const audioOutput = plan.hasAudio ? ['-map', '0:a:0', '-vn', '-sn', '-dn', '-c:a', 'aac', '-b:a', `${AUDIO_BITRATE_KBPS}k`, '-ac', '2', '-ar', '48000', `${encodedDir}/audio.mp4`] : [];

	const textOutputs = plan.textTracks.flatMap((track) => ['-map', `0:s:${track.subtitleIndex}`, '-vn', '-an', '-dn', '-c:s', 'webvtt', `${encodedDir}/text_${track.name}.vtt`]);

	return ['-hide_banner', '-nostdin', '-v', 'error', '-nostats', '-progress', 'pipe:1', '-y', '-i', sourcePath, '-filter_complex', filter, ...videoOutputs, ...audioOutput, ...textOutputs];
}

export const DASH_MANIFEST = 'manifest.mpd';
export const HLS_MANIFEST = 'master.m3u8';

/**
 * shaka-packager arguments, relative to the job directory so the manifests
 * reference segments with clean relative URLs. shaka-packager rejects the
 * `und` language code, so untagged text tracks are passed without a language.
 */
export function packagerArgs(plan: EncodingPlan): string[] {
	const video = plan.renditions.map(
		(rendition) =>
			`in=encoded/video_${rendition.name}.mp4,stream=video,init_segment=out/video/${rendition.name}/init.mp4,segment_template=out/video/${rendition.name}/$Number$.m4s,playlist_name=video/${rendition.name}/playlist.m3u8`,
	);
	const audio = plan.hasAudio ? ['in=encoded/audio.mp4,stream=audio,init_segment=out/audio/init.mp4,segment_template=out/audio/$Number$.m4s,playlist_name=audio/playlist.m3u8,hls_group_id=audio,hls_name=audio'] : [];
	const text = plan.textTracks.map(
		(track) =>
			`in=encoded/text_${track.name}.vtt,stream=text,${track.language === 'und' ? '' : `language=${track.language},`}segment_template=out/text/${track.name}/$Number$.vtt,playlist_name=text/${track.name}/playlist.m3u8,hls_group_id=text,hls_name=${track.language}`,
	);

	return [...video, ...audio, ...text, '--segment_duration', String(SEGMENT_DURATION_SECONDS), '--generate_static_live_mpd', '--mpd_output', `out/${DASH_MANIFEST}`, '--hls_master_playlist_output', `out/${HLS_MANIFEST}`];
}
