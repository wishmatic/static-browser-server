import { describe, expect, it } from "vitest";
import {
	getExtension,
	joinFilepath,
	normalizeFilepath,
} from "../../src/lib/main";

describe("normalizeFilepath", () => {
	it("prepends a leading slash", () => {
		expect(normalizeFilepath("index.html")).toBe("/index.html");
	});

	it("keeps an existing leading slash", () => {
		expect(normalizeFilepath("/index.html")).toBe("/index.html");
	});

	it("collapses empty segments", () => {
		expect(normalizeFilepath("//foo///bar//")).toBe("/foo/bar");
	});

	it("returns root for an empty string", () => {
		expect(normalizeFilepath("")).toBe("/");
	});

	it("does not collapse a trailing slash inside a filename", () => {
		// A trailing slash is treated as an empty segment and filtered out.
		expect(normalizeFilepath("/foo/bar/")).toBe("/foo/bar");
	});
});

describe("joinFilepath", () => {
	it("joins a base path and an addition", () => {
		expect(joinFilepath("/foo", "bar")).toBe("/foo/bar");
	});

	it("normalizes slashes between segments", () => {
		expect(joinFilepath("/foo/", "/bar")).toBe("/foo/bar");
	});

	it("handles a root base path", () => {
		expect(joinFilepath("/", "index.html")).toBe("/index.html");
	});
});

describe("getExtension", () => {
	it("returns the last extension", () => {
		expect(getExtension("file.tar.gz")).toBe("gz");
	});

	it("returns empty string for a file without an extension", () => {
		expect(getExtension("README")).toBe("");
	});

	it("returns empty string for a dotfile with no extension", () => {
		// ".gitignore".split(".") => ["", "gitignore"], so last part is "gitignore".
		expect(getExtension(".gitignore")).toBe("gitignore");
	});

	it("handles a trailing dot", () => {
		// "file.".split(".") => ["file", ""], so last part is "".
		expect(getExtension("file.")).toBe("");
	});
});
