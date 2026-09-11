import { PreviewController } from "../../src/lib/main";

declare global {
	interface Window {
		__testReady?: boolean;
		__testError?: string;
		__previewUrl?: string;
	}
}

const files: Record<string, string> = {
	"/index.html":
		'<html><body><h1 id="hello">Hello from preview</h1></body></html>',
	"/styles.css": "body { background: purple; color: white; }",
};

async function run() {
	const previewController = new PreviewController({
		// Same origin as the E2E server, with the unique-hostname prefix disabled
		// so the preview iframe also resolves to localhost.
		baseUrl: window.location.origin + "/",
		getFileContent: async (filepath: string) => {
			const found = files[filepath];
			if (found === undefined) {
				throw new Error("File not found: " + filepath);
			}
			return found;
		},
		disableUniqueHostname: true,
	});

	const previewUrl = await previewController.initPreview();

	const iframe = document.createElement("iframe");
	iframe.setAttribute("src", previewUrl);
	iframe.setAttribute("id", "preview-iframe");
	iframe.style.width = "600px";
	iframe.style.height = "400px";
	document.body.appendChild(iframe);

	window.__previewUrl = previewUrl;
	window.__testReady = true;
}

run().catch((error) => {
	window.__testError = String(error);
	window.__testReady = true;
});
