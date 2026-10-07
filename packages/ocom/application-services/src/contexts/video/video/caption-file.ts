/** Largest caption file accepted. Captions for a two-hour film are usually under 200 KB. */
export const MaxCaptionFileBytes = 1024 * 1024;

const SRT_TIMING = /^(\d{1,2}):(\d{2}):(\d{2})[,.](\d{3})(\s*-->\s*)(\d{1,2}):(\d{2}):(\d{2})[,.](\d{3})(.*)$/;
const VTT_TIMING = /^(?:\d{2,}:)?\d{2}:\d{2}\.\d{3}\s+-->\s+(?:\d{2,}:)?\d{2}:\d{2}\.\d{3}/;

const pad = (hours: string) => hours.padStart(2, '0');

/**
 * Validates a caption file and returns it as WebVTT, the format browsers and
 * the player read natively. WebVTT is kept as-is (with line endings
 * normalized); SubRip (SRT) is converted by adding the `WEBVTT` header and
 * writing timestamps with a `.` before the milliseconds.
 *
 * @throws {Error} When the file is too large, or is neither WebVTT nor SubRip with at least one cue.
 */
export function toWebVtt(content: string): string {
	if (Buffer.byteLength(content, 'utf8') > MaxCaptionFileBytes) {
		throw new Error('Caption files must be 1 MB or smaller');
	}
	const text = content.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
	const lines = text.split('\n');

	if (/^WEBVTT(?:[ \t].*)?$/.test(lines[0] ?? '')) {
		if (!lines.some((line) => VTT_TIMING.test(line.trim()))) {
			throw new Error('The WebVTT file has no captions');
		}
		return text.endsWith('\n') ? text : `${text}\n`;
	}

	let cues = 0;
	const converted = lines.map((line) => {
		const match = SRT_TIMING.exec(line.trim());
		if (!match) {
			return line;
		}
		cues++;
		const [, h1, m1, s1, ms1, arrow, h2, m2, s2, ms2, rest] = match as unknown as string[];
		return `${pad(h1 ?? '')}:${m1}:${s1}.${ms1}${arrow}${pad(h2 ?? '')}:${m2}:${s2}.${ms2}${rest}`;
	});
	if (cues === 0) {
		throw new Error('Captions must be a WebVTT (.vtt) or SubRip (.srt) file');
	}
	return `WEBVTT\n\n${converted.join('\n').trim()}\n`;
}
