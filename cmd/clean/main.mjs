import { crawlDir } from '@alshdavid/kit/dirs'
import { Paths } from '../../platform/paths.mjs'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as minimatch from 'minimatch'

/** @typedef {{ silent: boolean }} CleanOptions */

/** @returns {Promise<void>} */
export async function main(
  /** @type {string[]} */ args,
  /** @type {?CleanOptions} */ { silent } = { silent: false },
) {
  /** @type {Set<string>} */
  const toDelete = new Set()

  const settings = {
    lib: args.length === 0 || args.includes('lib'),
    target: args.length === 0 || args.includes('target'),
  }

  const ls = crawlDir({ 
    targetPath: Paths.ParcelRoot,
    dontCrawl: ['.git', 'node_modules', 'target', 'lib'] 
  })

  if (settings.target) {
    toDelete.add(path.join(Paths.ParcelRoot, 'target'))
  }

  if (settings.lib) for (const [absoluteFilepath] of ls) {
    const filepath = absoluteFilepath.replace(Paths.ParcelRoot + '/', '')
    if (minimatch.minimatch(filepath, 'packages/*/*/lib')) {
      toDelete.add(absoluteFilepath)
    }
  }

  for (const absoluteFilepath of toDelete.values()) {
    const filepath = absoluteFilepath.replace(Paths.ParcelRoot + '/', '')
    if (!silent) console.log('RM:', filepath)
    fs.rmSync(absoluteFilepath, { recursive: true })
  }
}
