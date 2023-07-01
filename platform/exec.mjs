import * as child_process from 'node:child_process'
import { Paths } from './paths.mjs'

export function $$(options) {
  return (command, options2) => $(command, {...options, ...options2})
}

export function $(command, options) {
  if (Array.isArray(command)) {
    command = command.join(' ')
  }
  child_process.execSync(command, {
    cwd: Paths.ParcelRoot,
    stdio: 'inherit',
    ...options,
  })
}
