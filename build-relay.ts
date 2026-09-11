import esbuild from "esbuild";
import fs from "fs";
import Mustache from "mustache";
import pathUtils from "path";

import { hashString } from "./utils";

const SHOULD_MINIFY = !!process.env.MINIFY;

const PREVIEW_OUT_DIR = pathUtils.join(__dirname, "./out/preview");
const RELAY_OUT_DIR = pathUtils.join(__dirname, "./out/preview/__csb_relay");
fs.mkdirSync(RELAY_OUT_DIR, { recursive: true });

async function bundleRelay(swPath: string): Promise<string> {
	const entry = pathUtils.join(__dirname, "./src/preview/relay/main.ts");

	const result = await esbuild.build({
		write: false,
		bundle: true,
		minify: SHOULD_MINIFY,
		sourcemap: false,
		platform: "browser",
		format: "iife",
		outdir: PREVIEW_OUT_DIR,
		entryPoints: [entry],
		define: {
			__SERVICE_WORKER_BUNDLE_NAME: JSON.stringify(swPath),
		},
	});

	const text = result.outputFiles[0].text;
	const bundleName = `/__csb_relay/__csb_relay.${hashString(text)}.js`;
	const fullPath = pathUtils.join(PREVIEW_OUT_DIR, bundleName);
	fs.writeFileSync(fullPath, text, "utf-8");
	return bundleName;
}

async function bundleServiceWorker(): Promise<string> {
	const entry = pathUtils.join(
		__dirname,
		"./src/preview/relay/service-worker.ts",
	);

	const result = await esbuild.build({
		write: false,
		bundle: true,
		minify: SHOULD_MINIFY,
		sourcemap: false,
		platform: "browser",
		format: "iife",
		outdir: PREVIEW_OUT_DIR,
		entryPoints: [entry],
	});

	const text = result.outputFiles[0].text;
	const bundleName = `/__csb_sw.${hashString(text)}.js`;
	const fullPath = pathUtils.join(PREVIEW_OUT_DIR, bundleName);
	fs.writeFileSync(fullPath, text, "utf-8");
	return bundleName;
}

async function run() {
	const swBundleUrl = await bundleServiceWorker();
	const relayBundleUrl = await bundleRelay(swBundleUrl);

	const relayIndexHTMLTemplate = fs.readFileSync(
		pathUtils.join(__dirname, "src/preview/relay/index.html"),
		"utf-8",
	);
	const renderedRelayIndexHTML = Mustache.render(relayIndexHTMLTemplate, {
		relayBundleUrl,
	});
	fs.writeFileSync(
		pathUtils.join(__dirname, "out/preview/__csb_relay/index.html"),
		renderedRelayIndexHTML,
		"utf-8",
	);

	fs.copyFileSync(
		pathUtils.join(__dirname, "src/preview/index.html"),
		pathUtils.join(__dirname, "out/preview/index.html"),
	);
}

run().catch(console.error);
