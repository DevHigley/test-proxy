import http from "http";
import testProxy from "../src";
import servers from "./servers";

var ipAddress: string;

beforeAll((done) => {
	http.get("http://api.ipify.org/", (res) => {
		res.setEncoding("utf8");
		res.on("data", (data) => {
			ipAddress = data;
			done();
		});
	});
});

test("http server over http proxy (anonymous)", (done) => {
	return servers.createHttpServer().then(({ httpServer, httpPort }) => {
		servers.createHttpProxyServer({ port: httpPort, anonymous: true }).then(({ proxyServer, proxyPort }) => {
			testProxy({ host: "localhost", port: proxyPort }, { hostname: `localhost:${httpPort}`, ipAddress: ipAddress }).then((result) => {
				Promise.all([servers.closeServer(httpServer), servers.closeServer(proxyServer)]).then(() => {
					expect(result).toMatchObject({ type: "http", anonymous: true });
					done();
				});
			});
		});
	});
});

test("http server over http proxy (transparent)", (done) => {
	return servers.createHttpServer().then(({ httpServer, httpPort }) => {
		servers.createHttpProxyServer({ port: httpPort, anonymous: false, ipAddress: ipAddress }).then(({ proxyServer, proxyPort }) => {
			testProxy({ host: "localhost", port: proxyPort }, { hostname: `localhost:${httpPort}`, ipAddress: ipAddress }).then((result) => {
				Promise.all([servers.closeServer(httpServer), servers.closeServer(proxyServer)]).then(() => {
					expect(result).toMatchObject({ type: "http", anonymous: false });
					done();
				});
			});
		});
	});
});

test("https server over https proxy (anonymous)", (done) => {
	return servers.createHttpsServer().then(({ httpsServer, httpsPort }) => {
		servers.createHttpsProxyServer({ port: httpsPort, anonymous: true }).then(({ proxyServer, proxyPort }) => {
			testProxy({ host: "localhost", port: proxyPort }, { hostname: `localhost:${httpsPort}`, ipAddress: ipAddress }).then((result) => {
				Promise.all([servers.closeServer(httpsServer), servers.closeServer(proxyServer)]).then(() => {
					expect(result).toMatchObject({ type: "https", anonymous: true });
					done();
				});
			});
		});
	});
});

test("https server over https proxy (transparent)", (done) => {
	return servers.createHttpsServer().then(({ httpsServer, httpsPort }) => {
		servers.createHttpsProxyServer({ port: httpsPort, anonymous: false, ipAddress: ipAddress }).then(({ proxyServer, proxyPort }) => {
			testProxy({ host: "localhost", port: proxyPort }, { hostname: `localhost:${httpsPort}`, ipAddress: ipAddress }).then((result) => {
				Promise.all([servers.closeServer(httpsServer), servers.closeServer(proxyServer)]).then(() => {
					expect(result).toMatchObject({ type: "https", anonymous: false });
					done();
				});
			});
		});
	});
});
