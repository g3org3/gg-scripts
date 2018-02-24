#!/usr/bin/env node
const spawnSync = require('child_process').spawnSync
const path = require('path')
const isLinked = __dirname.indexOf('node_modules') === -1
const resolve = filepath =>
  isLinked ? path.resolve(__dirname, `../${filepath}`) : `./${filepath}`

// Find paths
const eslint = resolve('node_modules/eslint')
const jest = resolve('node_modules/.bin/jest')
const eslintcli = resolve('node_modules/.bin/eslint')
const prettierEslint = resolve('node_modules/.bin/prettier-eslint')
const eslintConfigPath = path.resolve(__dirname, '../config/eslintrc.js')

// Scripts
const lintScript = () =>
  spawnSync(eslintcli, ['--config', eslintConfigPath, './src'], {
    stdio: 'inherit'
  })

const formatScript = (write = true) => {
  const options = [
    './src/**/*.js',
    '--eslint-path',
    eslint,
    '--eslint-config-path',
    eslintConfigPath
  ]
  if (write) options.push('--write')
  return spawnSync(prettierEslint, options, { stdio: 'inherit' })
}

const testScript = (options = {}) => {
  lintScript()
  const flags = []
  if (options.coverage) flags.push('--coverage')
  else if (options.watch) flags.push('--watch')
  return spawnSync(jest, flags, { stdio: 'inherit' })
}

const args = process.argv.slice(2)
const cmd = args[0]
switch (cmd) {
  case 'lint': {
    process.exit(lintScript())
  }
  case 'format': {
    process.exit(formatScript())
  }
  case 'test': {
    process.exit(testScript())
  }
  case 'coverage': {
    process.exit(testScript({ coverage: true }))
  }
  case 'test:w': {
    process.exit(testScript({ watch: true }))
  }
  case 'lint-difference': {
    process.exit(formatScript(false))
  }
  default:
    console.log(`Unknown command "${cmd}".`)
    process.exit(1)
}
