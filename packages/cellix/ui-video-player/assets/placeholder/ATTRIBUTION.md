# Placeholder video attribution

The files in this directory are the first 10 seconds of **Big Buck Bunny**,
(c) copyright 2008, Blender Foundation / www.bigbuckbunny.org, licensed under
[Creative Commons Attribution 3.0](https://creativecommons.org/licenses/by/3.0/).

The excerpt was re-encoded (640x360 VP9 / Opus) and packaged as DASH, with the
source's English captions as WebVTT, by `scripts/generate-placeholder.sh`.
`sidecar/es.vtt` is a hand-written Spanish translation of those captions used to
test separately loaded caption files.

`audio/described/` and `manifest-described.mpd` add an English audio description
track: the first 10 seconds of a narrated mix of the same soundtrack (narration
voiced with macOS `say`), encoded as Opus and packaged by shaka-packager with
`dash_roles=description` and the AudioPurposeCS `1` accessibility descriptor.
`manifest-described.mpd` is `manifest.mpd` with that adaptation set added and the
original audio marked `lang="en"` with `Role` `main`. These are local development and test
fixtures only and are not published with the package.
