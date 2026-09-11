import { defineConfig } from "@playwright/test";

export default defineConfig({
	testDir: "./test/e2e",
	fullyParallel: false,
	use: {
		baseURL: "http://localhost:4173",
	},
	webServer: {
		// Build the test site, then serve it.
		command:
			"node -r esbuild-register ./test/e2e/build.ts && node -r esbuild-register ./test/e2e/serve.ts",
		url: "http://localhost:4173/__harness.html",
		reuseExistingServer: !process.env.CI,
		timeout: 60_000,
	},
});
