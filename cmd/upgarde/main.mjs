import * as path from "node:path";
import * as fs from "node:fs";
import * as readline from "node:readline";
import { spawn } from "node:child_process";

/** @returns {Promise<void>} */
export async function main(/** @type {string[]} */ args) {
  let [packagePath = "package.json"] = args;
  if (!packagePath.startsWith("/")) {
    packagePath = path.join(process.cwd(), packagePath);
  }

  /** @type {Record<string, Set<string>>} */
  const atlaspackVersions = {};

  const file = await fs.promises.readFile(packagePath, "utf8");
  if (!file.includes("atlaspack")) return;
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
  }

  /** @type {Array<Promise<{ pkg: string; newVersion: string; oldVersions: Set<string> }>>} */
  const requests = [];

  for (const [name, versions] of Object.entries(atlaspackVersions)) {
    if (Array.from(versions)[0].includes("-canary")) {
      requests.push(
        $(`${name}@canary`).then((v) => ({
          pkg: name,
          newVersion: v,
          oldVersions: versions,
        }))
      );
    } else {
      requests.push(
        $(name).then((v) => ({
          pkg: name,
          newVersion: v,
          oldVersions: versions,
        }))
      );
    }
  }

  const updates = await Promise.all(requests);
  console.table(updates);
  for (const update of updates) {
    if (json.dependencies[update.pkg]) {
      json.dependencies[update.pkg] = update.newVersion;
    }
    if (json.devDependencies[update.pkg]) {
      json.devDependencies[update.pkg] = update.newVersion;
    }
  }

  if ((await askQuestion("Apply changes? [y/N] ")).toLowerCase() !== "y") {
    console.log("Skipping");
    return;
  }

  console.log("Updating package.json");
  await fs.promises.writeFile(
    packagePath,
    JSON.stringify(json, null, 2),
    "utf8"
  );
};

/** @returns {Promise<string>} */
async function $(/** @type {string} */ name) {
  const child = spawn("npm", ["info", name, "version"]);
  let data = "";
  for await (const chunk of child.stdout) {
    data += chunk;
  }
  let error = "";
  for await (const chunk of child.stderr) {
    error += chunk;
  }
  const exitCode = await new Promise((resolve, reject) => {
    child.on("close", resolve);
  });
  if (exitCode) {
    throw new Error(`subprocess error exit ${exitCode}, ${error}`);
  }
  return data.trim();
}

/** @returns {Promise<string>} */
function askQuestion(/** @type {string} */ query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    })
  );
}
