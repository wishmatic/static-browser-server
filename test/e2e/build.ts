import esbuild from "esbuild";
import fs from "fs";
import pathUtils from "path";

// Builds a self-contained test site into `test/e2e/.e2e-build` so the E2E does
// not depend on a prior `pnpm build`. Layout mirrors the production `out/`:
//
//   /__csb_sw.js                     service worker bundle
//   /__csb_relay/index.html          relay iframe document
//   /__csb_relay/__csb_relay.js      relay bundle
//   /index.html                      preview fallback (shown if the SW/relay fails)
//   /__harness                       E2E main frame (instantiates PreviewController)
//   /__harness.js                    E2E harness bundle
//
const OUT_DIR = pathUtils.join(__dirname, ".e2e-build");
const RELAY_DIR = pathUtils.join(OUT_DIR, "__csb_relay");

fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(RELAY_DIR, { recursive: true });

async function bundle(
	entry: string,
	outName: string,
	define?: Record<string, string>,
) {
	const result = await esbuild.build({
		entryPoints: [entry],
		bundle: true,
		write: false,
		platform: "browser",
		format: "iife",
		minify: false,
		define,
	});
	fs.writeFileSync(
		pathUtils.join(OUT_DIR, outName),
		result.outputFiles[0].text,
		"utf-8",
	);
}

const ROOT = pathUtils.join(__dirname, "../..");

// 1. Service worker bundle.
// 2. Relay bundle (defines the service worker script name it will register).
// 3. Relay iframe document with the bundle url substituted.
// 4. Preview fallback document (served at "/" if the SW/relay fails).
// 5. E2E harness bundle (instantiates the real PreviewController in the browser).
// 6. E2E main frame document.
async function main() {
	await bundle(
		pathUtils.join(ROOT, "src/preview/relay/service-worker.ts"),
		"__csb_sw.js",
	);

	await bundle(
		pathUtils.join(ROOT, "src/preview/relay/main.ts"),
		"__csb_relay/__csb_relay.js",
		{
			__SERVICE_WORKER_BUNDLE_NAME: JSON.stringify("/__csb_sw.js"),
		},
	);

	const template = fs.readFileSync(
		pathUtils.join(ROOT, "src/preview/relay/index.html"),
		"utf-8",
	);
	const rendered = template.replace(
		"{{{relayBundleUrl}}}",
		"/__csb_relay/__csb_relay.js",
	);
	fs.writeFileSync(pathUtils.join(RELAY_DIR, "index.html"), rendered, "utf-8");

	fs.writeFileSync(
		pathUtils.join(OUT_DIR, "index.html"),
		'<!doctype html><html><body><h1 id="fallback">Preview fallback</h1></body></html>',
		"utf-8",
	);

	await bundle(pathUtils.join(__dirname, "harness.ts"), "__harness.js");

	fs.copyFileSync(
		pathUtils.join(__dirname, "harness.html"),
		pathUtils.join(OUT_DIR, "__harness.html"),
	);

	console.log("e2e build complete:", OUT_DIR);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
