const node_fs = require('node:fs')
const node_path = require('node:path')

function path(target) {
  const parsed = node_path.parse(target)
  return node_path.join(parsed.dir, parsed.base)
}

function read(target, { cwd = process.cwd() } = {}) {
  const normal_target = path(target)
  const normal_cwd = path(cwd)
  const target_absolute = node_path.isAbsolute(normal_target) ? normal_target : node_path.join(normal_cwd, normal_target)
  if (!node_fs.existsSync(target_absolute)) {
    throw new Error('File does not exist: ' + target_absolute)
  }
  return node_fs.readFileSync(target_absolute, { encoding: 'utf8' })
}

function write(target, data, { cwd = process.cwd(), overwrite = false } = {}) {
  const normal_target = path(target)
  const normal_cwd = path(cwd)
  const target_absolute = node_path.isAbsolute(normal_target) ? normal_target : node_path.join(normal_cwd, normal_target)
  if (!overwrite && node_fs.existsSync(target_absolute)) {
    throw new Error('File already exists: ' + target_absolute)
  }
  return node_fs.writeFileSync(target_absolute, data, { encoding: 'utf8' })
}

function readJson(target, options) {
  const contents = read(target, options)
  return JSON.parse(contents)
}

function writeJson(target, json, options) {
  write(target, JSON.stringify(json, null, 2), options)
}

module.exports = {
  path,
  read,
  write,
  readJson,
  writeJson,
}




