import http from "http";

interface Proxy {
	host: string;
	port: number;
	protocol?: string;
	auth?: {
		username: string;
		password: string;
	};
}

interface Options {
	timeout?: number;
	hostname?: string;
	ipAddress?: string;
}

interface TestResult {
	type: string;
	latency: number;
	anonymous: boolean;
}

interface PingResult {
	ok: boolean;
	latency: number;
	headers: string[];
}

function test(proxy: Proxy, options?: Options): Promise<TestResult> {
	return new Promise((resolve, reject) => {
		const ipAddress = process.env.IP_ADDRESS || options?.ipAddress || getIpAddress();
		const pings = Promise.allSettled([ping({ ...proxy, protocol: "http" }, options), ping({ ...proxy, protocol: "https" }, options)]);
		Promise.all([ipAddress, pings]).then(([ipAddress, [httpResult, httpsResult]]) => {
			if (httpsResult.status === "fulfilled") {
				resolve({
					type: "https",
					latency: httpsResult.value.latency,
					anonymous: isAnonymous(ipAddress, httpsResult.value.headers)
				});
			} else if (httpResult.status === "fulfilled") {
				resolve({
					type: "http",
					latency: httpResult.value.latency,
					anonymous: isAnonymous(ipAddress, httpResult.value.headers)
				});
			} else reject(httpResult.reason.message);
		});
	});
}

function ping(proxy: Proxy, options?: Options): Promise<PingResult> {
	return new Promise((resolve, reject) => {
		const opts = createOptions(proxy, options);
		const startTime = new Date().getTime();
		const request = http.get(opts);
		request.on("response", (res) => {
			if (res.statusCode === 200)
				resolve({
					ok: true,
					headers: res.rawHeaders,
					latency: new Date().getTime() - startTime
				});
			else request.destroy(new Error(`${res.statusCode} ${res.statusMessage}`));
		});
		request.on("timeout", () => request.destroy(new Error("Request timed out")));
		request.on("error", (error) => reject(error));
	});
}

function createOptions(proxy: Proxy, options?: Options) {
	return {
		host: proxy.host,
		port: proxy.port,
		timeout: options?.timeout,
		path: `${proxy.protocol}://${options?.hostname || "api.ipify.org"}`,
		headers: {
			Host: options?.hostname || "api.ipify.org",
			...(proxy.auth && { "Proxy-Authorization": createProxyAuth(proxy.auth) })
		}
	};
}

function getIpAddress(): Promise<string> {
	return new Promise((resolve) =>
		http.get("http://api.ipify.org", (res) => {
			res.setEncoding("utf-8");
			res.on("data", (data) => resolve(data));
		})
	);
}

function createProxyAuth(auth: { username: string; password: string }): string {
	return `Basic ${Buffer.from(`${auth.username}:${auth.password}`).toString("base64")}`;
}

function isAnonymous(ipAddress: string, headers: string[]): boolean {
	return !headers.toString().includes(ipAddress);
}

export = test;
