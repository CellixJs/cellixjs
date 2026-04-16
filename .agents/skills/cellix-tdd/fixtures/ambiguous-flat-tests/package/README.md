# @cellix/network-endpoint

Normalize host and port configuration values into predictable runtime primitives.

## Install

```sh
npm install @cellix/network-endpoint
```

## Usage

```ts
import { parseHost, parsePort } from "@cellix/network-endpoint";

const host = parseHost(process.env.HOST);
const port = parsePort(process.env.PORT);
```

## Example

`parseHost()` defaults to `localhost` when no value is provided. `parsePort()` validates range and integer shape before returning a number.
