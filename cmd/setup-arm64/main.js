const node_fs = require('node:fs')
const node_path = require('node:path')
const _ = require('lodash')
const file = require('../../platform/files')
const { Directories } = require('../../platform/directories')
const { LogService } = require('../../platform/logging')

const Actions = {
  Set: 'set',
  Remove: 'remove'
}

const OffendingPackages = [
  {
    package: file.path('/packages/transformers/elm/package.json'),
    patches: [
      { action: Actions.Remove, path: ['peerDependencies', 'elm'] },
      { action: Actions.Set, path: ['peerDependencies', '@lydell/elm'], value: '*' },
    ]
  },
  {
    package: file.path('/packages/core/integration-tests/package.json'),
    patches: [
      { action: Actions.Remove, path: ['devDependencies', 'elm' ]},
      { action: Actions.Set, path: ['devDependencies', '@lydell/elm'], value: '*' },
    ]
  },  
]

function main(_args) {
  const logService = new LogService()

  for (const { package, patches } of OffendingPackages) {
    const path_absolute = file.path(`${Directories.parcelDefault}/${package}`)
    logService.writeLine(`Patching ${package}`)

    logService.subtitle(`Reading ${package}`)
    const input = file.readJson(path_absolute)
    logService.done()

    let output = _.cloneDeep(input)

    for (const { action, ...patch } of patches) {
      if (action === Actions.Remove) {
        logService.subtitle(`Removing "${patch.path.join('.')}"`)
        _.unset(output, patch.path)
        logService.done()
      }
      else if (action === Actions.Set) {
        logService.subtitle(`Setting "${patch.path.join('.')}" to "${patch.value}"`)
        output = _.set(output, patch.path, patch.value)
        logService.done()
      }
    }

    logService.subtitle(`Writing ${package}`)
    file.writeJson(path_absolute, output, { overwrite: true })
    logService.done().newline()
  }
}

module.exports = main
