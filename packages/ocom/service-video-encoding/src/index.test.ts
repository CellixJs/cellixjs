import { ServiceVideoEncoding as CellixServiceVideoEncoding, VideoEncodingError as CellixVideoEncodingError } from '@cellix/service-video-encoding';
import { describe, expect, it } from 'vitest';
import { ServiceVideoEncoding, VideoEncodingError } from './index.js';

describe('@ocom/service-video-encoding', () => {
	it('re-exports the Cellix ServiceVideoEncoding for infrastructure registration', () => {
		const service = new ServiceVideoEncoding({
			blobStorage: { downloadToFile: () => Promise.resolve(), uploadFile: () => Promise.resolve({} as never) },
		});

		expect(service).toBeInstanceOf(CellixServiceVideoEncoding);
	});

	it('re-exports VideoEncodingError so callers can classify failures by code', () => {
		expect(new VideoEncodingError('source-not-found', 'missing')).toBeInstanceOf(CellixVideoEncodingError);
	});
});
