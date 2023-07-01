#!/usr/bin/env node

import * as url from 'url'
import * as path from 'path'
import * as fs from 'fs'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

async function main() {
  const [,, command, ...args] = process.argv
  const targetFile = path.join(__dirname, '..', 'cmd', command, 'main.mjs')
  if (!fs.existsSync(targetFile)) {
    console.error('no script -', command)
    process.exit(1)
  }
  const module = await import(targetFile)
  if (typeof module.main !== 'function') {
    console.error('script does not export main() -', command)
    process.exit(1)
  }
  await module.main(args)
}

main()
  .catch(err => {
    console.error(err)
  })
