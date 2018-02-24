#!/usr/bin/env node
const spawnSync = require('child_process').spawnSync
const path = require('path')

// Find paths
const eslintcli = path.resolve(__dirname, '../node_modules/.bin/eslint')
const eslintConfigPath = path.resolve(__dirname, '../config/eslintrc.js')
const eslint = path.resolve(__dirname, '../node_modules/eslint')
const jest = path.resolve(__dirname, '../node_modules/.bin/jest')
const prettierEslint = path.resolve(
  __dirname,
  '../node_modules/.bin/prettier-eslint'
)


// Scripts
const lintScript = () => spawnSync(eslintcli, ['--config', eslintConfigPath, './src'], { stdio: 'inherit' })

const formatScript = () => {
    const options = [
      './src/**/*.js',
      '--eslint-path',
      eslint,
      '--eslint-config-path',
      eslintConfigPath,
      '--write'
    ]
  return spawnSync(prettierEslint, options, { stdio: 'inherit' })
}

const testScript = (options={}) => {
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
  default:
    console.log(`Unknown command "${cmd}".`)
    process.exit(1)
}
