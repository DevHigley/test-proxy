import http from "http";

interface Proxy {
	host: string;
	port: number;
	protocol: string;
	auth?: {
		username: string;
		password: string;
	};
}

interface TestResult {
	ok: boolean;
	anonymous?: boolean;
	responseTime?: number;
	error?: string;
}

interface PingResult {
	ok: boolean;
	headers: string[];
	responseTime: number;
}

function test(proxy: Proxy, options?: { timeout?: number; hostname?: string }): Promise<TestResult> {
	return new Promise((resolve) => {
		Promise.all([process.env.IP_ADDRESS || getIpAddress(), ping(proxy, options?.timeout, options?.hostname)])
			.then(([ipAddress, result]) =>
				resolve({
					ok: result.ok,
					anonymous: isAnonymous(ipAddress, result.headers),
					responseTime: result.responseTime
				})
			)
			.catch((error) => resolve({ ok: false, error: error.message }));
	});
}

function ping(proxy: Proxy, timeout?: number, hostname?: string): Promise<PingResult> {
	return new Promise((resolve, reject) => {
		const options = createOptions(proxy, timeout, hostname);
		const startTime = new Date().getTime();
		const request = http.request(options, (res) => {
			if (res.statusCode === 200)
				resolve({
					ok: true,
					headers: res.rawHeaders,
					responseTime: new Date().getTime() - startTime
				});
			else request.destroy(new Error(`${res.statusCode} ${res.statusMessage}`));
		});
		request.on("timeout", () => request.destroy(new Error("Request timed out")));
		request.on("error", (error) => reject(error));
		request.end();
	});
}

function createOptions(proxy: Proxy, timeout?: number, hostname?: string) {
	return {
		host: proxy.host,
		port: proxy.port,
		timeout: timeout,
		path: `${proxy.protocol}://${hostname ? hostname : "api.ipify.org"}`,
		headers: {
			Host: hostname || "api.ipify.org",
			...(proxy.auth && { "Proxy-Authorization": createProxyAuth(proxy.auth) })
		}
	};
}

function createProxyAuth(auth: { username: string; password: string }): string {
	return `Basic ${Buffer.from(`${auth.username}:${auth.password}`).toString("base64")}`;
}

function getIpAddress(): Promise<string> {
	return new Promise((resolve, reject) => {
		const request = http.get("http://api.ipify.org/", (res) => {
			res.setEncoding("utf8");
			res.on("data", (data) => resolve(data));
		});
		request.on("error", (error) => reject(error));
		request.end();
	});
}

function isAnonymous(ipAddress: string, headers: string[]): boolean {
	return !headers.toString().includes(ipAddress);
}

export = test;
