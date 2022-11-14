class LogService {
  column_width = 40

  write(input) {
    process.stdout.write(input)
    return this
  }

  writeLine(input) {
    this.write(input)
    this.newline()
    return this
  }

  newline() {
    process.stdout.write('\n')
    return this
  }

  subtitle(input) {
    this.write(`  ∟ ${input}... `)
    return this
  }

  done(input = 'Done') {
    this.writeLine(` ...${input}`)
    return this
  }
}

module.exports = { LogService }
