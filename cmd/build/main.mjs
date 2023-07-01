import { $$ } from '../../platform/exec.mjs'
import { main as clean } from '../clean/main.mjs'

const Env = {
  NODE_ENV: 'production' ,
  PARCEL_BUILD_ENV: 'production',
  PARCEL_SELF_BUILD: true,
  PARCEL_WORKER_BACKEND: 'process',
}

const $ = $$({ 
  env: { 
    ...process.env, ...Env 
  }
})

export async function main(args) {
  $('node scripts/build-native.js')
  
  await clean(['lib'], { silent: true })
  
  $([
    'npx parcel build', 
    'packages/core/{fs,codeframe,package-manager,utils}',
    'packages/reporters/{cli,dev-server}',
    'packages/utils/{parcel-lsp,parcel-lsp-protocol}'
  ])

  $('npx gulp')
}
