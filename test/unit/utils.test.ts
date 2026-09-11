import { describe, expect, it } from "vitest";
import { generateRandomId } from "../../src/lib/utils";
import { hashString } from "../../utils";

describe("generateRandomId", () => {
	it("returns a non-empty string", () => {
		expect(generateRandomId()).not.toBe("");
	});

	it("returns unique values across consecutive calls", () => {
		const ids = new Set([
			generateRandomId(),
			generateRandomId(),
			generateRandomId(),
		]);
		expect(ids.size).toBe(3);
	});

	it("returns a hexadecimal string", () => {
		expect(generateRandomId()).toMatch(/^[0-9a-f]+$/);
	});
});

describe("hashString", () => {
	it("is deterministic for identical input", () => {
		expect(hashString("hello")).toBe(hashString("hello"));
	});

	it("produces different hashes for different input", () => {
		expect(hashString("hello")).not.toBe(hashString("world"));
	});

	it("produces a base36 string", () => {
		expect(hashString("hello")).toMatch(/^[0-9a-z]+$/);
	});
});
