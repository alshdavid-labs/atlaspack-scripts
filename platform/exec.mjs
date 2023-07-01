import * as child_process from 'node:child_process'
import { Paths } from './paths.mjs'

/** @returns {typeof $} */
export function $$(
  /** @type {child_process.ExecSyncOptions} */ options
) {
  return (command, options2) => $(command, {...options, ...options2})
}

/** @returns {void} */
export function $(
  /** @type {string | string[]} */ command,
  /** @type {?child_process.ExecSyncOptions} */ options,
) {
  if (Array.isArray(command)) {
    command = command.join(' ')
  }
  child_process.execSync(command, {
    cwd: Paths.ParcelRoot,
    stdio: 'inherit',
    ...options,
  })
}
