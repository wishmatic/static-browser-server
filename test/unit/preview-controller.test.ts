// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PreviewController } from "../../src/lib/main";

type PortLike = {
	onmessage: ((evt: unknown) => void) | null;
	postMessage: (msg: unknown, ...rest: unknown[]) => void;
};

function makeMessageChannel() {
	const port2: PortLike = {
		onmessage: null,
		postMessage: vi.fn(),
	};
	const port1: PortLike = {
		onmessage: null,
		postMessage: vi.fn(),
	};
	return { port1, port2 } as unknown as {
		port1: MessagePort;
		port2: MessagePort;
	};
}

interface TestableController {
	getRelayUrl: (url: string) => string;
	getIndexAtPath: (path: string) => Promise<string | Uint8Array>;
}

describe("PreviewController.getRelayUrl", () => {
	it("rewrites the pathname to the relay path", () => {
		const controller = new PreviewController({
			baseUrl: "https://example.com/",
			getFileContent: async () => "",
		});
		expect(
			(controller as unknown as TestableController).getRelayUrl(
				"https://example.com/foo",
			),
		).toBe("https://example.com/__csb_relay/");
	});
});

describe("PreviewController.getIndexAtPath", () => {
	it("returns the first available index file", async () => {
		const controller = new PreviewController({
			baseUrl: "https://example.com/",
			getFileContent: async (filepath: string) => {
				if (filepath === "/foo/index.html") return "INDEX_CONTENT";
				throw new Error("not found");
			},
		});
		const result = await (
			controller as unknown as TestableController
		).getIndexAtPath("/foo");
		expect(result).toBe("INDEX_CONTENT");
	});

	it("throws when no index file is found", async () => {
		const controller = new PreviewController({
			baseUrl: "https://example.com/",
			getFileContent: async () => {
				throw new Error("not found");
			},
		});
		await expect(
			(controller as unknown as TestableController).getIndexAtPath("/foo"),
		).rejects.toThrow("No index file not found");
	});

	it("honors a custom indexFiles order", async () => {
		const calls: string[] = [];
		const controller = new PreviewController({
			baseUrl: "https://example.com/",
			indexFiles: ["index.htm", "index.html"],
			getFileContent: async (filepath: string) => {
				calls.push(filepath);
				throw new Error("not found");
			},
		});
		await expect(
			(controller as unknown as TestableController).getIndexAtPath("/foo"),
		).rejects.toThrow();
		expect(calls).toEqual(["/foo/index.htm", "/foo/index.html"]);
	});
});

describe("PreviewController.initPreview hostname", () => {
	beforeEach(() => {
		vi.stubGlobal("MessageChannel", vi.fn(makeMessageChannel));
	});

	it("prefixes the hostname with a unique id by default", async () => {
		const iframeContentWindow = { postMessage: vi.fn() };
		const iframe = {
			setAttribute: vi.fn(),
			style: {},
			contentWindow: iframeContentWindow,
			onload: null as null | (() => void),
		};
		vi.spyOn(document, "createElement").mockReturnValue(
			iframe as unknown as HTMLIFrameElement,
		);
		vi.spyOn(document.body, "appendChild").mockImplementation(
			() => iframe as unknown as HTMLIFrameElement,
		);

		const controller = new PreviewController({
			baseUrl: "https://example.com/",
			getFileContent: async () => "",
		});

		const urlPromise = controller.initPreview();

		// Trigger the iframe onload, then simulate a "preview/ready" message.
		iframe.onload!();
		const channel = vi.mocked(MessageChannel).mock.results[0].value;
		channel.port1.onmessage!({
			data: { $channel: "$CSB_RELAY", $type: "preview/ready" },
		} as MessageEvent);

		const url = await urlPromise;
		expect(url).toMatch(/^https:\/\/[0-9a-f]+-example\.com\/$/);
	});

	it("does not prefix the hostname when disableUniqueHostname is set", async () => {
		const iframeContentWindow = { postMessage: vi.fn() };
		const iframe = {
			setAttribute: vi.fn(),
			style: {},
			contentWindow: iframeContentWindow,
			onload: null as null | (() => void),
		};
		vi.spyOn(document, "createElement").mockReturnValue(
			iframe as unknown as HTMLIFrameElement,
		);
		vi.spyOn(document.body, "appendChild").mockImplementation(
			() => iframe as unknown as HTMLIFrameElement,
		);

		const controller = new PreviewController({
			baseUrl: "https://example.com/",
			getFileContent: async () => "",
			disableUniqueHostname: true,
		});

		const urlPromise = controller.initPreview();
		iframe.onload!();
		const channel = vi.mocked(MessageChannel).mock.results[0].value;
		channel.port1.onmessage!({
			data: { $channel: "$CSB_RELAY", $type: "preview/ready" },
		} as MessageEvent);

		const url = await urlPromise;
		expect(url).toBe("https://example.com/");
	});
});
