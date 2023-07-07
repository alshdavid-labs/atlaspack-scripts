import { $$ } from '../../platform/exec.mjs'
import { main as clean } from '../clean/main.mjs'

const $ = $$({ 
  env: { 
    NODE_ENV: 'production' ,
    PARCEL_BUILD_ENV: 'production',
    PARCEL_SELF_BUILD: 'true',
    PARCEL_WORKER_BACKEND: 'process',
    ...process.env, 
  }
})

export async function main(
  /** @type {string[]} */ args,
) {
  console.log('Native Modules Build')
  $('node scripts/build-native.js')
  
  console.log('Clean lib folders')
  await clean(['lib'], { silent: true })
  
  console.log('Parcel Self Build')
  $([
    'npx parcel build',
    '--no-cache',
    'packages/core/{fs,codeframe,package-manager,utils}',
    'packages/reporters/{cli,dev-server}',
    'packages/utils/{parcel-lsp,parcel-lsp-protocol}',
  ])

  console.log('Gulp')
  $('npx gulp')

  console.log('Build TS')
  $('npx lerna run build-ts')

  console.log('Check TS')
  $('npx lerna run check-ts')
}
