#! /usr/bin/env node

const fs = require('node:fs')
const path = require('node:path')
const  { Directories } = require('../../platform/directories')

const settingsFilePath = path.join(Directories.parcelDefault, '.vscode', 'settings.json')
const defaultSettings = {
    "javascript.validate.enable": false
}

function main(_args) {
    if (!fs.existsSync(settingsFilePath)) {
        process.stdout.write('Creating settings.json...')
        fs.writeFileSync(settingsFilePath, JSON.stringify(defaultSettings, null, 2), { encoding: 'utf8' })
        process.stdout.write(' Done\n')
    } else {
        process.stdout.write('Editing settings.json \n')
        const settings = fs.readFileSync(settingsFilePath, { encoding: 'utf8' })

        process.stdout.write('Adding key "javascript.validate.enable"...')
        settings["javascript.validate.enable"] = false
        process.stdout.write(' Done\n')

        fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2), { encoding: 'utf8' })
    }
}

module.exports = main
