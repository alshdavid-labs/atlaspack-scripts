import * as fs from "node:fs";
import * as path from "node:path";
import * as glob from "glob";
import { dirname, exists, json, ln, lnInner, ls, mkdir, mv, rm } from "../../platform/fs.mjs";


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
  const parcelPackageIndex = {}
  /** @type {Record<string, string>} */
  const targetPackageIndex = {}

  const packageJsons = glob.sync('packages/*/*/package.json', { cwd: ATLASPACK_SRC_PATH })
  for (const packageJsonPath of packageJsons) {
    const { name } = json(`${ATLASPACK_SRC_PATH}/${packageJsonPath}`)
    parcelPackageIndex[name] = dirname(`${ATLASPACK_SRC_PATH}/${packageJsonPath}`)
  }

  for (const dirName of ls(`${TARGET_PATH}/node_modules`)) {
    if (dirName === 'parcel') {
      targetPackageIndex[dirName] = `${TARGET_PATH}/node_modules/${dirName}`
      continue
    }
    if (dirName.startsWith('@parcel')) {
      for (const dir of fs.readdirSync(path.join(TARGET_PATH, "node_modules", '@parcel'))) {
        targetPackageIndex[`@parcel/${dir}`] = `${TARGET_PATH}/node_modules/@parcel/${dir}`
      }
    }
  }

  console.log(parcelPackageIndex)

  // if (!exists(`${TARGET_PATH}/node_modules/@parcel__link`)) {
  //   mkdir(`${TARGET_PATH}/node_modules/@parcel__link`)
  //   for (const [pkgName, pkgPath] of Object.entries(targetPackageIndex)) {
  //     if (!(pkgName in parcelPackageIndex)) {
  //       continue
  //     }
  //     mv(
  //       pkgPath, 
  //       `${TARGET_PATH}/node_modules/@parcel__link/${pkgName}`,
  //     )
  //   }
  // }

  // for (const [pkgName, pkgPath] of Object.entries(targetPackageIndex)) {
  //   if (!(pkgName in parcelPackageIndex)) {
  //     continue
  //   }
  //   if (exists(pkgPath)) {
  //     rm(pkgPath)
  //   }
  //   lnInner(
  //     parcelPackageIndex[pkgName],
  //     pkgPath,
  //   )
  //   if (exists(`${pkgPath}/node_modules`)) {
  //     rm(`${pkgPath}/node_modules`)
  //   }
  //   if (exists(`${TARGET_PATH}/node_modules/@parcel__link/${pkgName}/node_modules`)) {
  //     ln(
  //       `${TARGET_PATH}/node_modules/@parcel__link/${pkgName}/node_modules`,
  //       `${pkgPath}/node_modules`
  //     )
  //   }
  // }

  // rm(`${TARGET_PATH}/node_modules/.bin/parcel`)
  // ln(`${TARGET_PATH}/node_modules/parcel/src/bin.js`, `${TARGET_PATH}/node_modules/.bin/parcel`)
}
