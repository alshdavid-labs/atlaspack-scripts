const fs = require('node:fs')
const path = require('node:path')

const TargetType = {
    FOLDER: 0,
    FILE: 1,
    LINK: 2,
}

// Crawls a directory and generates a file list
function crawlDir({
    relPath = '',
    cwd = process.cwd(),
    dontCrawl = [],
    depth = undefined
} = {}) {
    const files = {}
    
    let currentDepth = 1

    function _crawl(_relPath) {
        const contents = fs.readdirSync(path.join(cwd, _relPath))

        for (const target of contents) {
            const relTargetPath = path.join(_relPath, target)
            const stat = fs.lstatSync(path.join(cwd, _relPath, target))
            if (stat.isSymbolicLink()) {
                files[relTargetPath] = TargetType.LINK
                continue
            }
            if (stat.isDirectory()) {
                files[relTargetPath] = TargetType.FOLDER
                if (dontCrawl.find(ignored => relTargetPath.startsWith(ignored))) {
                    continue
                }
                if (currentDepth !== undefined && currentDepth >= depth) {
                    continue
                }
                currentDepth++
                _crawl(path.join(_relPath, target))
                currentDepth--
                continue
            }
            if (stat.isFile()) {
                files[relTargetPath] = TargetType.FILE
                continue
            }
        }
    }

    _crawl(relPath)

    return files
}

module.exports = {
    TargetType,
    crawlDir,
}
