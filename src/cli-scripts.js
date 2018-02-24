#!/usr/bin/env node
const spawnSync = require('child_process').spawnSync
const path = require('path')

const args = process.argv.slice(2)
const cmd = args[0]
switch (cmd) {
  case 'lint': {
    const eslint = path.resolve(__dirname, '../node_modules/.bin/eslint')
    const eslintConfigPath = path.resolve(__dirname, '../config/eslintrc.js')
    const result = spawnSync(eslint, ['--config', eslintConfigPath, './src'], {
      stdio: 'inherit'
    })
    process.exit(result.signal)
  }
  case 'format': {
    const eslint = path.resolve(__dirname, '../node_modules/eslint')
    const prettierEslint = path.resolve(
      __dirname,
      '../node_modules/.bin/prettier-eslint'
    )
    const eslintConfigPath = path.resolve(__dirname, '../config/eslintrc.js')
    const options = [
      './src/**/*.js',
      '--eslint-path',
      eslint,
      '--eslint-config-path',
      eslintConfigPath,
      '--write'
    ]
    const result = spawnSync(prettierEslint, options, { stdio: 'inherit' })
    process.exit(result.signal)
  }
  case 'test': {
    const jest = path.resolve(__dirname, '../node_modules/.bin/jest')
    const result = spawnSync(jest, { stdio: 'inherit' })
    process.exit(result.signal)
  }
  case 'test:w': {
    const jest = path.resolve(__dirname, '../node_modules/.bin/jest')
    const result = spawnSync(jest, ['--watch'], { stdio: 'inherit' })
    process.exit(result.signal)
  }
  default:
    console.log(`Unknown script "${cmd}".`)
    process.exit(1)
}
