#!/usr/bin/env node

const ATLASPACK_DEV = process.env.ATLASPACK_DEV === 'true' ? true : false

const path = require('path')

const packageJsonPath = require.resolve('@atlaspack/cli/package.json')
const packagePath = path.dirname(packageJsonPath)

if (ATLASPACK_DEV) {
  require('@atlaspack/babel-register/index.js')
  require(path.join(packagePath, 'src', 'bin.js'))
} else {
  require(path.join(packagePath, 'lib', 'bin.js'))
}