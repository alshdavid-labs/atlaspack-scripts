import * as path from "node:path";
import * as fs from "node:fs/promises";
import { parse } from "./parse.mts";

type Command = {
  tag?: string;
  path?: string[];
  pattern?: string[];
  ["pattern-exclude"]?: string[];
  ["cwd"]?: string;
};

type PackageJson = {
  name: string;
  version: string;
  resolutions?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

async function main(args: string[]): Promise<number> {
  const command: Command = parse(args);

  const tag = typeof command.tag === "string" ? command.tag : "latest";
  const cwd = toAbsolute(command["cwd"], process.cwd());

  console.error(`Tag: ${tag}`);
  console.error(`Cwd: ${cwd}`);
  console.error(`Paths: (${argToArray(command.path).length})`);
  for (const p of argToArray(command.path)) {
    console.error(`. ${p}`);
  }
  console.error(`Patterns: (${argToArray(command.pattern).length})`);
  for (const p of argToArray(command.pattern)) {
    console.error(`. ${p}`);
  }
  console.error(
    `PatternsExclude: (${argToArray(command["pattern-exclude"]).length})`
  );
  for (const p of argToArray(command["pattern-exclude"])) {
    console.error(`. ${p}`);
  }

  console.error("Scanning...");

  const pkgs = Array.from(
    new Set([
      ...(await resolvePackages(argToArray(command.path), cwd)),
      ...(await resolveGlobs(
        argToArray(command.pattern),
        argToArray(command["pattern-exclude"]),
        cwd
      )),
    ])
  );
  pkgs.sort();

  console.error(`Resolved: (${pkgs.length})`);
  for (const p of pkgs) {
    console.error(`${p}`);
  }

  if (!pkgs.length) {
    console.error("No packages supplied");
    return 1;
  }

  console.error("Upgrading...");
  const packages: Record<string, string> = {};
  const targetPackagesPending: Record<string, Promise<string> | null> = {};

  for (const pkg of pkgs) {
    const pkgPath = path.join(cwd, pkg);

    const pkgString = await fs.readFile(pkgPath, "utf8");
    const pkgJson: PackageJson = JSON.parse(pkgString);
    packages[pkgPath] = pkgString;

    const dependencies = {
      ...(pkgJson.resolutions || {}),
      ...(pkgJson.dependencies || {}),
      ...(pkgJson.devDependencies || {}),
      ...(pkgJson.optionalDependencies || {}),
    };

    for (const [key, _version] of Object.entries(dependencies)) {
      if (key.startsWith("@atlaspack/") || key === "atlaspack") {
        targetPackagesPending[key] = null;
      }
    }
  }

  for (const [key, version] of Object.entries(targetPackagesPending)) {
    if (version != null) continue;
    targetPackagesPending[key] = getVersionInfo(key, tag);
  }

  await Promise.all(Object.values(targetPackagesPending));

  const targetPackages: Record<string, string> = {};
  for (const [key, version] of Object.entries(targetPackagesPending)) {
    if (version == null) continue;
    targetPackages[key] = await version;
  }

  const toUpgrade = Object.entries(targetPackages);
  toUpgrade.sort((a, b) => a[0].localeCompare(b[0]));
  const largest = Math.max(...toUpgrade.map((a) => a[0].length));
  console.error(`Upgrading: (${toUpgrade.length})`);
  for (const [k, v] of toUpgrade) {
    console.error(`${k.padEnd(largest)} -> ${v}`);
  }

  const updated = new Set();

  for (const [key, version] of Object.entries(targetPackages)) {
    const reKey = key.replaceAll("/", "\\/");
    for (const [packagePath, jsonString] of Object.entries(packages)) {
      // Updates a key in place without affecting JSON formatting
      const update = jsonString.replace(
        new RegExp(`"${reKey}"(.*):(.*)"[^(root:\\*)](.*)"`, "g"),
        `"${key}"$1:$2"${version}"`
      );

      if (packages[packagePath] !== update) {
        updated.add(packagePath);
        packages[packagePath] = update;
      }
    }
  }

  console.error(`Updated: (${updated.size})`);
  for (const v of updated.values()) {
    console.log(`${v}`);
  }

  for (const [pkgPath, json] of Object.entries(packages)) {
    await fs.writeFile(pkgPath, json, "utf8");
  }

  return 0;
}

main(process.argv)
  .then((status) => process.exit(status))
  .catch((error) => {
    process.stderr.write(`${error}`);
    process.exit(1);
  });

async function getVersionInfo(
  pkgName: string,
  tag: string = "latest"
): Promise<string> {
  const response = await globalThis.fetch(
    `https://registry.npmjs.org/${pkgName}/${tag}`
  );
  if (!response.ok) {
    console.log(response.status)
    console.log(response.statusText)
    console.log(await response.text())
    throw new Error(`Failed to fetch: ${pkgName}`);
  }
  const body = await response.json();
  return body.version;
}

async function resolvePackages(inputs: string[], cwd: string) {
  const pkgs: string[] = [];

  for (const pkg of inputs.map((v) => toAbsolute(v, cwd))) {
    if (path.basename(pkg) !== "package.json") {
      pkgs.push(path.join(pkg, "package.json"));
    }
    pkgs.push(pkg);
  }

  return pkgs;
}

async function resolveGlobs(
  inputs: string[],
  exclude: string[] = [],
  cwd: string = process.cwd()
) {
  const pkgs: string[] = [];

  for (const [i, pkg] of inputs.entries()) {
    for await (const found of fs.glob(pkg, {
      cwd,
      exclude: [
        'node_modules',
        '**/node_modules/**',
        '**/.git/**',
        '.git',
        ...exclude,
      ],
    })) {
      pkgs.push(found);
    }
  }

  return pkgs;
}

function argToArray(
  inputs: string[] | string | undefined | null
): Array<string> {
  const pkgsBase: string[] = [];
  if (typeof inputs === "string") {
    pkgsBase.push(inputs);
  } else if (Array.isArray(inputs)) {
    pkgsBase.push(...inputs);
  } else {
    return [];
  }
  return pkgsBase;
}

function toAbsolute(input: string | undefined, cwd: string): string {
  if (!input) {
    return cwd;
  }
  return path.isAbsolute(input) ? input : path.normalize(path.join(cwd, input));
}
