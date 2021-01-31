import fs from "fs";
import http from "http";
import https from "https";
import httpProxy from "http-proxy";
import { AddressInfo } from "net";

const key = fs.readFileSync(`${__dirname}/key.pem`);
const cert = fs.readFileSync(`${__dirname}/cert.pem`);

function createHttpServer(): Promise<{ httpServer: http.Server; httpPort: number }> {
	return new Promise((resolve) => {
		const server = http.createServer((req, res) => {
			res.writeHead(200, { "Content-Type": "text/plain" });
			res.write("http test");
			res.end();
		});
		server.listen(() => resolve({ httpServer: server, httpPort: (server.address() as AddressInfo).port }));
	});
}

function createHttpProxyServer(options: { port: number; anonymous: boolean; ipAddress?: string }): Promise<{ proxyServer: http.Server; proxyPort: number }> {
	return new Promise((resolve) => {
		var proxy = httpProxy.createProxyServer();
		const server = http.createServer((req, res) => {
			if (!options.anonymous) res.setHeader("X-Forwarded-For", options.ipAddress!);
			proxy.web(req, res, { target: req.url, headers: { host: `localhost:${options.port}` } }, () => {
				res.writeHead(400, "Bad request");
				res.end();
			});
		});
		server.listen(() => resolve({ proxyServer: server, proxyPort: (server.address() as AddressInfo).port }));
	});
}

function createHttpsServer(): Promise<{ httpsServer: https.Server; httpsPort: number }> {
	return new Promise((resolve) => {
		const server = https.createServer({ key: key, cert: cert }, (req, res) => {
			res.writeHead(200, { "Content-Type": "text/plain" });
			res.write("https test");
			res.end();
		});
		server.listen(() => resolve({ httpsServer: server, httpsPort: (server.address() as AddressInfo).port }));
	});
}

function createHttpsProxyServer(options: { port: number; anonymous: boolean; ipAddress?: string }): Promise<{ proxyServer: httpProxy; proxyPort: number }> {
	return new Promise((resolve) => {
		const server = httpProxy.createProxyServer({
			secure: false,
			agent: https.globalAgent,
			target: `https://localhost:${options.port}`,
			headers: {
				host: `localhost:${options.port}`
			}
		});
		server.on("proxyReq", (proxyReq, req, res, opts) => res.setHeader("X-Forwarded-For", `${options.ipAddress}`));
		server.listen(options.port + 1);
		resolve({ proxyServer: server, proxyPort: options.port + 1 });
	});
}

function closeServer(server: http.Server | https.Server | httpProxy): Promise<void> {
	return new Promise((resolve) => server.close(() => resolve()));
}

export default { createHttpServer, createHttpProxyServer, createHttpsServer, createHttpsProxyServer, closeServer };
