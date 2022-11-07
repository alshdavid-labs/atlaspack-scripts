const fs = require('node:fs')
const path = require('node:path')
const { Directories } = require('../../platform/directories')

function main(_args) {
    const commands = fs.readdirSync(Directories.scripts)

    const output = `
        _parcel-script() {
            compadd ${commands.filter(cmd => cmd !== 'autocomplete').join(' ')}
        }

        compdef _parcel-script parcel-script
    `
    console.log(output)
}

module.exports = main
