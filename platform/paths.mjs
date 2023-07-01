import * as path from 'node:path'
import * as url from 'node:url'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

export const Paths = {
  ScriptsRoot: path.join(__dirname, '..'),
  ParcelRoot: (
    process.env.PARCEL_SRC_PATH ||
    path.join(__dirname, '../../../parcel-bundler/parcel')
  ),
}
