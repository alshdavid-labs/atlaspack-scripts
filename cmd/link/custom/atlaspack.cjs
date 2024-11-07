#!/usr/bin/env node

const ATLASPACK_DEV = process.env.ATLASPACK_DEV === 'true' ? true : false

const path = require('path')

const packageJsonPath = require.resolve('@atlaspack/cli/package.json')
const packagePath = path.dirname(packageJsonPath)

if (ATLASPACK_DEV) {
  require('@atlaspack/babel-register/index.js')
  console.log('===========================')
  console.log('==== ATLASPACK SOURCES ====')
  console.log('===========================')
  require(path.join(packagePath, 'src', 'bin.js'))
} else {
  console.log('===========================')
  console.log('====  ATLASPACK LOCAL  ====')
  console.log('===========================')
  require(path.join(packagePath, 'lib', 'bin.js'))
}