import { describe, expect, it } from "vitest";
import { EXTENSIONS_MAP } from "../../src/lib/mime";

describe("EXTENSIONS_MAP", () => {
	it("maps common text extensions", () => {
		expect(EXTENSIONS_MAP.get("html")).toBe("text/html");
		expect(EXTENSIONS_MAP.get("css")).toBe("text/css");
		expect(EXTENSIONS_MAP.get("js")).toBe("text/javascript");
	});

	it("maps common binary extensions", () => {
		expect(EXTENSIONS_MAP.get("png")).toBe("image/png");
		expect(EXTENSIONS_MAP.get("jpg")).toBe("image/jpeg");
	});

	it("maps JSON", () => {
		expect(EXTENSIONS_MAP.get("json")).toBe("application/json");
	});

	it("is populated", () => {
		expect(EXTENSIONS_MAP.size).toBeGreaterThan(100);
	});
});
