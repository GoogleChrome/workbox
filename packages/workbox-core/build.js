#!/usr/bin/env node
import esbuild from 'esbuild'
import { nodeExternalsPlugin } from 'esbuild-node-externals'

const watch = process.argv.slice(1).includes('--watch')
const withDeps = process.argv.slice(1).includes('--with-deps')

const config = {
  bundle: true,
  minify: false,
  sourcemap: withDeps ? false : true,
  target: 'es2020',
  plugins: [
    ...(withDeps ? [] : [nodeExternalsPlugin()]),
    {
      name: 'workbox',
      setup(build) {
        let count = 0
        build.onEnd((result) => {
          if (count++ !== 0) {
            console.log(`Rebuilding ${build.initialOptions.entryPoints} (${build.initialOptions.format})…`)
          }
        })
      },
    },
  ],
}

const builds = [
  { entryPoints: ['src/index.ts'], format: 'esm', outfile: 'dist/index.esm.js', platform: 'browser' },
  { entryPoints: ['src/index.ts'], format: 'cjs', outfile: 'dist/index.js', platform: 'browser' },
]

builds.forEach(async (build) => {
  const context = await esbuild.context({ ...config, ...build })

  if (watch) {
    console.log(`Watching ${build.entryPoints} (${build.format})…`)
    await context.watch()
  } else {
    await context.rebuild()
    context.dispose()
    console.log(`Built ${build.entryPoints} (${build.format}) ${withDeps ? '(with-deps)' : ''}…`)
  }
})