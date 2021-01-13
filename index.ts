import http from "http";

interface Proxy {
	host: string;
	port: number;
	auth?: {
		username: string;
		password: string;
	};
	protocol?: "http" | "https";
}

interface TestResult {
	http: boolean;
	https: boolean;
	proxy: Proxy;
	anonymous: boolean;
	responseTime: number;
}

function test(proxy: Proxy, options: { timeout?: number; hostname?: string }): Promise<TestResult> {
	return new Promise((resolve, reject) => {
		Promise.all([
			process.env.ip_address || getIpAddress(),
			checkHttp(proxy, options.timeout, options.hostname),
			checkHttps(proxy, options.timeout, options.hostname)
		])
			.then(([ipAddress, httpResult, httpsResult]) => {
				resolve({
					http: httpResult.ok,
					https: httpsResult.ok,
					anonymous: isAnonymous(ipAddress, httpResult.headers),
					responseTime: httpResult.responseTime,
					proxy: Object.assign(proxy, { protocol: httpsResult.ok ? "https" : "http" })
				});
			})
			.catch((err) => reject({ err: err.message, proxy: proxy }));
	});
}

function checkHttp(proxy: Proxy, timeout?: number, hostname?: string): Promise<{ ok: boolean; headers: string[]; responseTime: number }> {
	return new Promise((resolve, reject) => {
		const options = generateOptions(proxy, "http", timeout, hostname);
		const startTime = new Date().getTime();
		const request = http.get(options, (res) => {
			if (res.statusCode === 200)
				resolve({
					ok: true,
					headers: res.rawHeaders,
					responseTime: new Date().getTime() - startTime
				});
			else reject(new Error(`${res.statusCode} ${res.statusMessage}`));
		});
		request.on("timeout", () => {
			reject(new Error("Request timed out"));
			request.destroy();
		});
		request.on("error", (err) => reject(err));
		request.end();
	});
}

function checkHttps(proxy: Proxy, timeout?: number, hostname?: string): Promise<{ ok: boolean }> {
	return new Promise((resolve) => {
		const options = generateOptions(proxy, "https", timeout, hostname);
		const request = http.get(options, (res) => resolve({ ok: res.statusCode === 200 }));
		request.on("timeout", () => request.destroy());
		request.on("error", () => request.destroy());
		request.end();
	});
}

function generateOptions(proxy: Proxy, protocol: string, timeout?: number, hostname?: string): object {
	return {
		host: proxy.host,
		port: proxy.port,
		timeout: timeout,
		path: hostname ? `${protocol}://${hostname}` : `${protocol}://api.ipify.org`,
		headers: {
			host: hostname || "api.ipify.org",
			"Proxy-Authorization": createProxyAuth(proxy.auth)
		}
	};
}

function createProxyAuth(auth?: { username: string; password: string }): string {
	return auth ? `Basic ${Buffer.from(`${auth.username}:${auth.password}`).toString("base64")}` : "";
}

function getIpAddress(): Promise<string> {
	return new Promise((resolve, reject) => {
		http.get("http://api.ipify.org/", (res) => {
			res.setEncoding("utf8");
			res.on("data", (data) => resolve(data));
		}).on("error", (e) => reject(e));
	});
}

function isAnonymous(ipAddress: string, headers: string[]): boolean {
	return !headers.toString().includes(ipAddress);
}

export = test;
