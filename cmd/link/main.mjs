import * as fs from "node:fs";
import * as path from "node:path";
import * as url from "node:url";
import * as glob from "glob";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

/** @returns {Promise<void>} */
export async function main(/** @type {string[]} */ args) {
  const TARGET_PATH = args?.[0] && path.isAbsolute(args?.[0]) 
    ? args[0] 
    : path.join(process.cwd(), (args?.[0] || '.'))

  const { ATLASPACK_SRC_PATH } = process.env;
  if (typeof TARGET_PATH !== "string") {
    process.exit(1);
  }
  if (typeof ATLASPACK_SRC_PATH !== "string") {
    process.exit(1);
  }

  /** @type {Record<string, string>} */
  const packageIndex = {}

  const packageJsons = glob.sync('packages/*/*/package.json', { cwd: ATLASPACK_SRC_PATH })
  for (const packageJsonPath of packageJsons) {
    const fullPath = path.join(ATLASPACK_SRC_PATH, packageJsonPath)
    const { name } = JSON.parse(fs.readFileSync(fullPath, 'utf8'))
    packageIndex[name] = path.dirname(fullPath)
  }

  fs.rmSync(path.join(TARGET_PATH, 'node_modules', 'atlaspack'), { force: true, recursive: true  })
  fs.rmSync(path.join(TARGET_PATH, 'node_modules', '@atlaspack'), { force: true, recursive: true  })

  fs.mkdirSync(path.join(TARGET_PATH, 'node_modules', '@atlaspack'), { recursive: true })

  for (const [packageName, packagePath] of Object.entries(packageIndex)) {
    const dest = path.join(TARGET_PATH, 'node_modules', packageName)
    console.log(`Linking:\n\t${packagePath}\n\t${path.join(TARGET_PATH, 'node_modules', packageName)}\n`)
    if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true })
    fs.symlinkSync(packagePath, dest)
  }

  const binDest = path.join(TARGET_PATH, 'node_modules', '.bin', 'atlaspack')
  const binSrc = path.join(__dirname, 'custom', 'atlaspack.cjs')
  
  fs.rmSync(binDest, { recursive: true, force: true })
  fs.mkdirSync(path.join(TARGET_PATH, 'node_modules', '.bin'), { recursive: true })
  fs.cpSync(binSrc, binDest)
}
