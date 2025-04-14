import * as path from "node:path";
import * as fs from "node:fs";

/** @returns {Promise<void>} */
export async function main(/** @type {string[]} */ args) {
	let [, , startPath = ""] = process.argv;
	if (!startPath.startsWith("/")) {
		startPath = path.join(process.cwd(), startPath);
	}

  /** @type {Record<string, Set<string>>} */
	const atlaspackVersions = {};
	/** @type {Array<{ json: string; pkg: string; version: string; }>} */
  const atlaspackLocations = [];

	for await (const found of find(
		startPath,
		{ node_modules: true, ".git": true },
		(f) => f.endsWith("package.json"),
	)) {
		const file = await fs.promises.readFile(found, "utf8");
		if (!file.includes("atlaspack")) continue;
		const json = JSON.parse(file);

		for (const [key, value] of Object.entries({
			...(json.dependencies || {}),
			...(json.devDependencies || {}),
		})) {
			if (!key.startsWith("@atlaspack/")) continue;
			if (typeof value !== "string") continue;
			if (value === "root:*") continue;
			atlaspackVersions[key] = atlaspackVersions[key] || new Set();
			atlaspackVersions[key].add(value);
			atlaspackLocations.push({
				json: found,
				pkg: key,
				version: value,
			});
		}
	}
	console.log(`References: ${atlaspackLocations.length}`);
	console.log(atlaspackVersions);
};

/** @returns {AsyncIterable<String>} */
async function* ls(
  /** @type {string} */ targetPath = ".", 
  /** @type {Record<string, boolean>} */ skip = {}
) {
	yield targetPath;
	for (const dirent of await fs.promises.readdir(targetPath, {
		withFileTypes: true,
	})) {
		if (skip[path.basename(targetPath)]) continue;
		if (dirent.isDirectory())
			yield* ls(path.join(targetPath, dirent.name), skip);
		else yield path.join(targetPath, dirent.name);
	}
}

/** @returns {AsyncIterable<String>} */
async function* find(
  /** @type {string} */ path = ".", 
  /** @type {Record<string, boolean>} */ skip,
  /** @type {(file: string) => boolean} */ query,
) {
	for await (const f of ls(path, skip)) if (query(f) !== false) yield f;
}
