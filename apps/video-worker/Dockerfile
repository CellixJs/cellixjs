# Video encoding worker image for the Azure Container Apps Job (ADR 0035).
#
# Build the bundle first (`pnpm --filter @apps/video-worker run build`), then
# build from this directory, for example in CI without Docker:
#   az acr build --registry <name> --platform linux/amd64 --image video-worker:<tag> apps/video-worker
FROM node:22.22.2-trixie-slim

# shaka-packager release and the SHA-256 of each Linux build, from the GitHub release.
ARG SHAKA_PACKAGER_VERSION=v3.9.3
ARG SHAKA_PACKAGER_SHA256_AMD64=7a3cf35ad146fd7810b4ededab363c8a3e6121d1b2c8391f53863126186f9ee6
ARG SHAKA_PACKAGER_SHA256_ARM64=d3a50cecc139b54435be1bbbfba5c0ea822d9e1e7edc3531f7821fba65ceebb0

# Debian's ffmpeg is built with libx264 and aac. The packager build matches the
# image architecture, so the same file builds for Azure (amd64) and for local
# checks on Apple silicon (arm64).
RUN set -eux; \
	apt-get update; \
	apt-get install -y --no-install-recommends ffmpeg ca-certificates curl; \
	arch="$(dpkg --print-architecture)"; \
	case "$arch" in \
		amd64) asset=packager-linux-x64; sha="$SHAKA_PACKAGER_SHA256_AMD64" ;; \
		arm64) asset=packager-linux-arm64; sha="$SHAKA_PACKAGER_SHA256_ARM64" ;; \
		*) echo "unsupported architecture: $arch" >&2; exit 1 ;; \
	esac; \
	curl -fsSL -o /usr/local/bin/packager "https://github.com/shaka-project/shaka-packager/releases/download/${SHAKA_PACKAGER_VERSION}/${asset}"; \
	echo "${sha}  /usr/local/bin/packager" | sha256sum -c -; \
	chmod +x /usr/local/bin/packager; \
	apt-get purge -y --auto-remove curl; \
	rm -rf /var/lib/apt/lists/*

# Fail the build, rather than the first job, if a required tool or encoder is missing.
RUN set -eux; \
	ffmpeg -hide_banner -encoders | grep -E '^\s*\S+\s+libx264\s'; \
	ffmpeg -hide_banner -encoders | grep -E '^\s*\S+\s+aac\s'; \
	ffprobe -hide_banner -version; \
	packager --version

WORKDIR /app
COPY deploy/dist/ ./dist/

ENV NODE_ENV=production \
	WORKER_MODE=once
USER node
CMD ["node", "dist/index.mjs"]
