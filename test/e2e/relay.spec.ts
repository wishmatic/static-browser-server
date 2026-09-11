import { expect, test } from "@playwright/test";

test("PreviewController serves a file through the relay/service worker round trip", async ({
	page,
}) => {
	// Navigate to the harness main frame, which instantiates the real
	// PreviewController, registers the relay service worker, and injects a
	// preview iframe.
	await page.goto("/__harness.html");

	// The harness sets this once initPreview() resolves.
	await page.waitForFunction(() => window.__testReady === true);

	const error = await page.evaluate(() => window.__testError);
	expect(error).toBeUndefined();

	const previewUrl = await page.evaluate(() => window.__previewUrl);
	expect(previewUrl).toContain("http://localhost:4173/");

	// The preview iframe should load the file content returned by
	// getFileContent, via the service worker -> relay -> parent round trip.
	const previewFrame = page.frameLocator("#preview-iframe");
	await expect(previewFrame.locator("#hello")).toHaveText("Hello from preview");
});
