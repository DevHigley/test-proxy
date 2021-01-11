# test-proxy

## Description

test-proxy is a lightweight nodejs http(s) proxy testing library.

What does it do:

-   tests http(s) proxies
-   checks response time (ms)
-   checks proxy anonymity (boolean)
-   checks support for specific hostnames (websites)
-   supports proxy authentication
-   supports optional connection timeout
-   supports ip_address environment variable for fewer requests

## Installation

```
npm install test-proxy
yarn add test-proxy
```

## Usage
```js
const testProxy = require("test-proxy");

testProxy({ host: "89.187.177.91", port: 80 })
	.then((result) => console.log(result))
	.catch((err) => console.log(err));

//result on success
{
  http: true,
  https: true,
  anonymous: true,
  responseTime: 279,
  proxy: { host: '89.187.177.91', port: 80, protocol: "https" }
}
//on failure
{
  err: '503 Service Unavailable',
  proxy: { host: '89.187.177.91', port: 80 }
}
```
