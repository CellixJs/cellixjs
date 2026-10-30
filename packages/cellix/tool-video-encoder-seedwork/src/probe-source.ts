import { VideoEncodingError } from './video-encoding-error.ts';

/** Subtitle codecs ffmpeg can convert to WebVTT. Image-based codecs are excluded. */
const TEXT_SUBTITLE_CODECS = new Set(['subrip', 'srt', 'ass', 'ssa', 'mov_text', 'webvtt', 'text', 'ttml']);
const LANGUAGE_TAG = /^[a-z]{2,3}(-[a-z0-9]{1,8})*$/i;

export interface SourceInfo {
	/** Displayed width, after applying rotation metadata. */
	width: number;
	/** Displayed height, after applying rotation metadata. */
	height: number;
	durationSeconds: number;
	hasAudio: boolean;
	/** Text subtitle streams, by their index among all subtitle streams (`0:s:<index>`). */
	textSubtitles: { subtitleIndex: number; language: string }[];
}

interface ProbeStream {
	codec_type?: string;
	codec_name?: string;
	width?: number;
	height?: number;
	duration?: string;
	tags?: { language?: string; rotate?: string };
	side_data_list?: { rotation?: number }[];
}

interface ProbeOutput {
	streams?: ProbeStream[];
	format?: { duration?: string };
}

export function ffprobeArgs(sourcePath: string): string[] {
	return ['-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', sourcePath];
}

export function parseProbeOutput(stdout: string): SourceInfo {
	let probe: ProbeOutput;
	try {
		probe = JSON.parse(stdout) as ProbeOutput;
	} catch (error) {
		throw new VideoEncodingError('unsupported-source', 'ffprobe returned unreadable output for the source', { cause: error });
	}

	const streams = probe.streams ?? [];
	const video = streams.find((stream) => stream.codec_type === 'video' && stream.width && stream.height);
	if (!video?.width || !video.height) {
		throw new VideoEncodingError('unsupported-source', 'The source has no video stream');
	}

	const durationSeconds = Number(probe.format?.duration ?? video.duration);
	if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
		throw new VideoEncodingError('unsupported-source', 'The source has no known duration');
	}

	const rotated = Math.abs(rotationOf(video)) % 180 === 90;
	const subtitles = streams.filter((stream) => stream.codec_type === 'subtitle');

	return {
		width: rotated ? video.height : video.width,
		height: rotated ? video.width : video.height,
		durationSeconds,
		hasAudio: streams.some((stream) => stream.codec_type === 'audio'),
		textSubtitles: subtitles.flatMap((stream, subtitleIndex) => (TEXT_SUBTITLE_CODECS.has(stream.codec_name ?? '') ? [{ subtitleIndex, language: languageOf(stream) }] : [])),
	};
}

function rotationOf(stream: ProbeStream): number {
	const fromSideData = stream.side_data_list?.find((data) => typeof data.rotation === 'number')?.rotation;
	return fromSideData ?? Number(stream.tags?.rotate ?? 0);
}

function languageOf(stream: ProbeStream): string {
	const language = stream.tags?.language;
	return language && LANGUAGE_TAG.test(language) ? language : 'und';
}
