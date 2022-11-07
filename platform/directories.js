const path = require('node:path')

const Directories = {
    root: path.resolve(__dirname, '..'),
    parcelDefault: process.env.PARCEL_REPO_PATH || path.resolve(__dirname, '..', '..', 'parcel'),
    scripts: path.resolve(__dirname, '..', 'cmd'),
}

module.exports = { Directories }
