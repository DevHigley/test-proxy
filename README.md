# test-proxy

## Description

test-proxy is a lightweight Node.js http(s) proxy testing library

### What it does:

-   tests http(s) proxies
-   checks response time (ms)
-   checks proxy anonymity (boolean)
-   checks support for specific hostnames (websites)
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

testProxy({ host: "89.187.177.91", port: 80 })
	.then((result) => console.log(result))
	.catch((error) => console.log(error));
```
#### Result on success:
```js
{
  http: true,
  https: true,
  anonymous: true,
  responseTime: 279,
  proxy: { host: '89.187.177.91', port: 80, protocol: "https" }
}
```
#### Result on failure:
```js
{
  error: '503 Service Unavailable',
  proxy: { host: '89.187.177.91', port: 80 }
}
```
