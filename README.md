# test-proxy

## Description

test-proxy is a lightweight Node.js http(s) proxy testing library

### What it does:

-   tests http(s) proxies
-   checks response time (ms)
-   checks proxy anonymity (boolean)
-   checks support for specific hostname
-   supports proxy authentication
-   supports optional connection timeout
-   supports ip_address environment variable for fewer requests

## Installation

```
npm install @devhigley/test-proxy
yarn add @devhigley/test-proxy
```

## Usage

```js
const testProxy = require("@devhigley/test-proxy");

const proxy = { host: "89.187.177.91", port: 80, protocol: "http" };

testProxy(proxy).then((result) => console.log(result));
```

#### Result on success:

```js
{
  ok: true,
  anonymous: true,
  responseTime: 1337
}
```

#### Result on failure:

```js
{
  ok: false,
  error: '503 Service Unavailable'
}
```
