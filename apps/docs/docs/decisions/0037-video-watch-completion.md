---
sidebar_position: 37
sidebar_label: 0037 Video Watch Completion
description: "Track which parts of a video each member has played, in 5-second buckets checked by the API, so skipping ahead does not count as watching."
status: accepted
contact: tang-eddie
date: 2026-10-07
deciders: tang-eddie
consulted:
informed:
---

# Video Watch Completion

## Context and Problem Statement

Communities need to know that a member has watched a video all the way through. Reaching the end is not enough: a member who watches the first minute and then jumps to the end has not watched the video.

Players stream segments directly from Blob Storage with a read token ([ADR 0036](0036-manual-video-encoding-by-staff.md)), so the API never sees segment requests. Even if it did, a downloaded segment only proves it was buffered: players fetch ahead of the playhead, faster than real time.

How does the API record which parts of a video a member has actually played?

## Decision Drivers

1. Skipping ahead must leave the skipped part unwatched.
2. A viewing can be finished over several sessions and in any order.
3. Reports from the browser must not be able to credit a video faster than it can be played.
4. Video managers can see who has finished each video.
5. No extra infrastructure, and no change to how segments are served.

## Considered Options

- Buckets of played time, reported by the player and checked by the API
- Segment downloads, from storage logs or by serving segments through the API
- Reaching the end of the video
- DRM licences

## Decision Outcome

Chosen option: **Buckets of played time, reported by the player and checked by the API**.

### How it works

- The video's timeline is split into 5-second buckets. A 10-minute video has 120.
- While a member watches, the watch page reads the video element's `played` ranges (browsers add to them only while media plays, so seeking leaves the skipped part out) and sends them to `videoRecordProgress` every 15 seconds, and when playback pauses or ends, the page is hidden, or the member leaves the page.
- A bucket counts once at least half of it was played, so a quick scrub across it does not.
- The viewing is complete when 98% of the buckets are played, so a final fade-out or rounding at the end does not block completion. `completedAt` is set once and never cleared.
- Each report sends everything played so far. Buckets already counted are ignored, so a failed report is covered by the next one, and the API can safely receive the same range twice.

### Checking reports against real time

Each viewing holds playback credit, in seconds of video. Credit builds at 2 seconds per second of real time (playback up to 2× counts), up to 120 seconds, and each newly counted bucket spends its length. A new viewing starts with 30 seconds. When credit runs out, the rest of a report is not counted, and the next report sends it again.

The cap means leaving a video idle cannot bank time to claim later. A client that invents reports still cannot finish a video in less than half its length.

### Data

One `VideoViewing` aggregate per member per video (unique index on video and member), in the video bounded context:

```jsonc
{
  "community": "…", "video": "…", "member": "…",
  "durationSeconds": 600,                     // snapshot when the viewing started
  "bucketSeconds": 5,
  "bucketCount": 120,
  "watchedBuckets": [ { "start": 0, "end": 11 }, { "start": 118, "end": 119 } ],
  "watchedBucketCount": 14,
  "creditSeconds": 50,
  "lastReportAt": "…",
  "completedAt": null
}
```

`watchedBuckets` holds runs of bucket indexes, inclusive at both ends, which merge as gaps fill: a fully watched video is `[{ start: 0, end: 119 }]`.

### Permissions

A new `isOwnVideoViewing` permission is true only in a member's visa for their own viewing. Members can record and see only their own viewings. Members who can manage site content (`canManageVideos`) can also see everyone's viewings in their community. Staff and guests never record or see viewings.

### API

- `videoRecordProgress(input: { id, ranges })` records the signed-in member's played ranges for a ready video in the current community, creating the viewing on the first report.
- `Video.myViewing` and `Video.viewings` return the caller's viewing and the viewings they may see. Each `VideoViewing` has `coverage`, `unwatched` spans in seconds, `completedAt`, and `member`.

### Consequences

- Good, because skipping ahead leaves gaps that block completion, and the watch page shows the gaps so members can go back to them.
- Good, because no infrastructure or segment-serving changes are needed.
- Good, because the credit check bounds how fast a forged client can claim a video.
- Bad, because reports come from the browser, so someone calling the API directly at real-time speed can claim a video without watching it. This records that the video played, not that someone paid attention.
- Bad, because up to 15 seconds of playback can be lost if the page closes before its last report is saved.
- Neutral, because a viewing keeps the duration it started with. If a video is re-encoded to a different length, existing viewings keep their buckets.

## Pros and Cons of the Options

### Segment downloads

- Bad, because players buffer ahead of the playhead, so downloaded segments do not show what was played.
- Bad, because it needs storage diagnostic logs (delayed and hard to tie to a member) or serving segments through the API (load and cost).

### Reaching the end of the video

- Bad, because seeking to the end satisfies it.

### DRM licences

- Bad, because a licence shows a key was issued, not what was played.
- Bad, because it needs a licence service, encrypted encoding, and per-platform certificates.

## More Information

If a stronger guarantee is needed later, these can be added without changing the data model: blocking seeking past the furthest point watched, random "still watching?" check-ins, or shorter-lived playback tokens.
