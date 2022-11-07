/**
 * @param {Array.<string>} argsList
 * @returns {Object.<string,string[]>}
 */
function parseArgs(argsList) {
    const args = {
        _: [],
    }

    for (let i = 0; i < argsList.length; i++) {
        const completeSymbol = argsList[i]
        
        let dashes = 0
        if (completeSymbol.startsWith('--')) dashes = 2
        else if (completeSymbol.startsWith('-')) dashes = 1

        const strippedSymbol = completeSymbol.substring(dashes)

        if (dashes > 0) {
            if (!(strippedSymbol in args)) {
                args[strippedSymbol] = []
            }

            const nextSymbol = argsList[i+1]

            if (nextSymbol !== undefined && nextSymbol.startsWith('-')) {
                args[strippedSymbol].push('true')
            } else {
                args[strippedSymbol].push(nextSymbol)
                i++
            }
            continue
        }

        args._.push(strippedSymbol)
    }
    
    return args
}

module.exports = { parseArgs }
