const fs = require('node:fs')
const path = require('node:path')
const { Directories } = require('../../platform/directories')

const pnpmWorkspaceFilePath = path.join(Directories.parcelDefault, 'pnpm-workspace.yaml')
const srcPnpmWorkspaceFilePath = path.join(__dirname, 'assets', 'pnpm-workspace.yaml')

function main(_args) {
    if (!fs.existsSync(pnpmWorkspaceFilePath)) {
        process.stdout.write('Copying "pnpm-workspace.yaml"...')
        fs.copyFileSync(srcPnpmWorkspaceFilePath, pnpmWorkspaceFilePath)
        process.stdout.write(' Done\n')
    }
}

module.exports = main
