import fs from "fs";
import http from "http";
import pathUtils from "path";

const PORT = 4173;
const ROOT = pathUtils.join(__dirname, ".e2e-build");

const MIME: Record<string, string> = {
	".html": "text/html; charset=utf-8",
	".js": "text/javascript",
	".css": "text/css",
	".json": "application/json",
};

const server = http.createServer((req, res) => {
	const url = new URL(req.url || "/", "http://localhost");
	let pathname = decodeURIComponent(url.pathname);

	// Serve the preview fallback at the document root.
	if (pathname === "/") {
		pathname = "/index.html";
	}

	const safePath = pathUtils.normalize(pathname).replace(/^(\.\.[/\\])+/, "");
	let filePath = pathUtils.join(ROOT, safePath);

	// Resolve directory paths to their index.html.
	fs.stat(filePath, (statErr, stat) => {
		if (!statErr && stat.isDirectory()) {
			filePath = pathUtils.join(filePath, "index.html");
		}

		fs.readFile(filePath, (err, data) => {
			if (err) {
				res.writeHead(404);
				res.end("Not found");
				return;
			}
			res.setHeader(
				"Content-Type",
				MIME[pathUtils.extname(filePath)] || "application/octet-stream",
			);
			res.writeHead(200);
			res.end(data);
		});
	});
});

server.listen(PORT, () => {
	console.log(`E2E server listening on http://localhost:${PORT}`);
});
