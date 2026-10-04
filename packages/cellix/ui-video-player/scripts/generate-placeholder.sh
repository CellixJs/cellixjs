#!/bin/sh
# Regenerates assets/placeholder from a local copy of Big Buck Bunny
# (https://peach.blender.org, CC BY 3.0). Requires ffmpeg and shaka-packager.
#
#   pnpm run generate:placeholder -- /path/to/bbb_sunflower_2160p_60fps_normal_captioned.mp4
#
# Output: the first 10 seconds as 640x360 VP9/Opus, packaged as static DASH with
# 2 second WebM segments plus the source's English captions as WebVTT. VP9/Opus is
# used instead of H.264/AAC because Playwright's Chromium build ships without
# proprietary codecs. The source must contain a WebVTT/mov_text caption stream.
#
# Hand-maintained files (ATTRIBUTION.md and sidecar/) are preserved.
set -eu

SOURCE="${1:?usage: generate-placeholder.sh <source-video>}"
PACKAGER="${PACKAGER:-packager}"
DURATION=10
OUT="$(cd "$(dirname "$0")/.." && pwd)/assets/placeholder"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

ffmpeg -y -v error -t "$DURATION" -i "$SOURCE" -map 0:v:0 -an -vf scale=640:360,fps=30 \
	-c:v libvpx-vp9 -b:v 600k -minrate 600k -maxrate 600k -row-mt 1 -deadline good -cpu-used 4 -g 60 -keyint_min 60 -sc_threshold 0 "$WORK/video.webm"
ffmpeg -y -v error -t "$DURATION" -i "$SOURCE" -map 0:a:0 -vn -c:a libopus -b:a 64k -ac 2 "$WORK/audio.webm"
ffmpeg -y -v error -i "$SOURCE" -map 0:s:0 -t "$DURATION" "$WORK/captions.vtt"

mkdir -p "$WORK/dash"
(
	cd "$WORK"
	"$PACKAGER" \
		'in=video.webm,stream=video,init_segment=dash/video/init.webm,segment_template=dash/video/$Number$.webm' \
		'in=audio.webm,stream=audio,init_segment=dash/audio/init.webm,segment_template=dash/audio/$Number$.webm' \
		'in=captions.vtt,stream=text,language=en,dash_label=English,dash_roles=caption,segment_template=dash/text/en/$Number$.vtt' \
		--segment_duration 2 --generate_static_live_mpd --mpd_output dash/manifest.mpd
)
ffmpeg -y -v error -ss 1 -i "$SOURCE" -frames:v 1 -vf scale=640:360 -q:v 5 "$WORK/dash/poster.jpg"

mkdir -p "$OUT"
find "$OUT" -mindepth 1 -maxdepth 1 ! -name ATTRIBUTION.md ! -name sidecar -exec rm -rf {} +
cp -R "$WORK/dash/." "$OUT/"
echo "placeholder written to $OUT"
