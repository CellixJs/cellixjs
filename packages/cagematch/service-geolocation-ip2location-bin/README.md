# `@ocom/service-geolocation-ip2location-bin`

Local IP2Location BIN adapter for `@cellix/service-geolocation-base`, backed by the official [`ip2location-nodejs`](https://www.npmjs.com/package/ip2location-nodejs) reader.

```ts
import { ServiceGeolocationIp2LocationBin } from '@ocom/service-geolocation-ip2location-bin';

const service = new ServiceGeolocationIp2LocationBin({ databasePath: '/data/IP2LOCATION.BIN' });
await service.startUp();
const location = await service.lookup('198.51.100.42');
await service.shutDown();
```

The BIN file is provisioned separately and is not included in this package. The provider's reader supports IPv4 and IPv6 when the selected database includes IPv6 records. Its asynchronous `openAsync`, `getAllAsync`, and `closeAsync` methods are used. A narrow reader factory can be injected as the second constructor argument for deterministic tests or a custom reader lifecycle.