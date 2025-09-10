import { ServiceOtel } from '@ocom/service-otel';

const Otel = new ServiceOtel({
    //biome-ignore lint:useLiteralKeys
	exportToConsole: process.env['NODE_ENV'] === 'development',
    //biome-ignore lint:useLiteralKeys
	useSimpleProcessors: process.env['NODE_ENV'] === 'development',
});
Otel.startUp();

/*
export function initOtel():ServiceOtel {

  return Otel;
};
*/
