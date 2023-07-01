const fs = require('node:fs')
const path = require('node:path')
const allTargets = require('./clean.list')
const { parseArgs } = require('../../platform/parse-args.js') 
const { TargetType, crawlDir } = require('../../platform/crawl-dir')
const  { Directories } = require('../../platform/directories')

function main(rawArgs) {
    const args = parseArgs(rawArgs.splice(2))

    const settings = {
        projectPath: Directories.parcelDefault,
        targets: [ ...(args['target'] || []), ...(args['t'] || []) ],
        dry: !!args['dry'] || !!args['d'] || false,
        all: !!args['all'],
        dontCrawl: ['.git', 'node_modules', ...(args['ignore'] || [])]
    }
    
    if (args['project-path']) {
        if (path.isAbsolute(args['project-path'])) {
            settings.projectPath = args['project-path']
        } else {
            settings.projectPath = path.relative(process.cwd(), args['project-path'])
        }
    }
    
    if (settings.all) {
        settings.targets = Object.keys(allTargets)
    }
    
    if (settings.targets.length === 0) {
        console.log("Select targets with \"clean --target one --target two -t three\"")
        console.log("")
        console.log("Targets available to clean:")
        console.log(` * all`)
        for (const targetName of Object.keys(allTargets)) {
            console.log(` * ${targetName}`)
        }
        return 1
    }
    
    for (const targetName of settings.targets) {
        if (targetName !== 'all' && !Object.keys(allTargets).includes(targetName)) {
            console.log(`Target not registed for cleaning: ${targetName}`)
            return 1
        }
    }
    
    const files = crawlDir({
        cwd: settings.projectPath,
        dontCrawl: settings.dontCrawl,
    })
    
    function removeTarget(relPath) {
        if (args.dry || args.d) {
            return
        } 
        const absPath = path.join(settings.projectPath, relPath)
        if (files[relPath] === TargetType.LINK) {
            fs.unlinkSync(absPath)
        } else {
            fs.rmSync(absPath, { recursive: true })
        }
    }
    
    function remove(relPath) {
        if (relPath instanceof RegExp) {
            process.stdout.write(`Scanning... ${relPath}\n`)
            for (const targetName in files) {
                if (relPath.test(targetName)) {
                    process.stdout.write(`Removing... ${targetName}`)
                    removeTarget(targetName)
                    process.stdout.write(' ...Done\n')
                }
            }
            return
        }
    
        if (typeof relPath === 'string') {
            process.stdout.write(`Removing... ${relPath}`)
    
            if (relPath[0] === '/') {
                relPath = relPath.substring(1)
            }
            
            if (relPath in files) {
                removeTarget(relPath)
                process.stdout.write(' ...Done\n')
            } else {
                process.stdout.write(' ...Does not exit\n')
            }
        }
    }
    
    console.log('Cleaning...', settings.targets.join(', '))
    
    for (const target of settings.targets) 
        if (allTargets[target])
            for (const match of allTargets[target]) {
                remove(match)
    }
    
    console.log('Done')
}

module.exports = main
