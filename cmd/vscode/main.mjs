import { Paths } from '../../platform/paths.mjs'
import * as fs from 'node:fs'
import * as path from 'node:path'

const settings = {
  "javascript.validate.enable": false,
  "typescript.validate.enable": true
}

/** @returns {Promise<void>} */
export async function main(
  /** @type {string[]} */ args,
) {
  const settingsFile = path.join(Paths.ParcelRoot, '.vscode', 'settings.json')
 
  console.log(settingsFile)

  /** @type {Record<string, any>} */
  let currentSettings = {}

  if (fs.existsSync(settingsFile)) {
    currentSettings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'))
  }

  const newSettings = {
    ...currentSettings,
    ...settings,
  }

  fs.writeFileSync(settingsFile, JSON.stringify(newSettings, null, 2) + '\n', 'utf8')
  console.log('Settings updated')
}
