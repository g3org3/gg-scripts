#!/usr/bin/env node
const Enquirer = require('enquirer')
const spawnSync = require('child_process').spawnSync
const execSync = require('child_process').execSync
const fs = require('fs')
const path = require('path')
const isLinked = __dirname.indexOf('node_modules') === -1
const resolve = filepath =>
  isLinked ? path.resolve(__dirname, `../${filepath}`) : `./${filepath}`

// setup
const enquirer = new Enquirer()
enquirer.register('confirm', require('prompt-confirm'))
enquirer.register('input', require('prompt-input'))
enquirer.register('radio', require('prompt-radio'))

// Find paths
const eslint = resolve('node_modules/eslint')
const jest = resolve('node_modules/.bin/jest')
const eslintcli = resolve('node_modules/.bin/eslint')
const prettierEslint = resolve('node_modules/.bin/prettier-eslint')
const eslintConfigPath = path.resolve(__dirname, '../config/eslintrc.js')
const pkgPy = path.resolve(__dirname, '../helpers/pkg.py')

// Scripts
const lintScript = () =>
  spawnSync(eslintcli, ['--config', eslintConfigPath, './src'], {
    stdio: 'inherit'
  })

const replaceAll = (target, search, replacement) =>
  target.replace(new RegExp(search, 'g'), replacement)

const isCommandAvailable = (cmd) => {
  try {
    execSync(`which ${cmd} 2> /dev/null`)
    return true
  } catch (err) {
    console.log(`\n⚠️  ${cmd} is not available.\n`)
  }
}
const isDockerStuffIsAvailable = () => isCommandAvailable('docker') && isCommandAvailable('docker-compose')

const formatScript = (listDiferrent) => {
  const options = [
    './src/**/*.js',
    '--eslint-path',
    eslint,
    '--eslint-config-path',
    eslintConfigPath
  ]
  if (listDiferrent) options.push('--list-different')
  else options.push('--write')
  return spawnSync(prettierEslint, options, { stdio: 'inherit' })
}

const testScript = (options = {}) => {
  if (!lintScript().status) {
    const flags = []
    if (options.coverage) flags.push('--coverage')
    else if (options.watch) flags.push('--watch')
    return spawnSync(jest, flags, { stdio: 'inherit' })
  }
  return { status: 1 }
}

const buildFrontEndScript = () => {
  try {
    // execSync('rm -fr public')
    // execSync('rm views/index.ejs')
    // cd
    // execSync('NODE_PATH=./src npm run build')
    // mv build ../auth/public
    // cp public/index.html views/index.ejs
  } catch (err) {
    console.log(err)
  }
  // #!/bin/bash
  // (
  //   rm -fr public
  //   rm views/index.ejs
  //   cd ../admin
  //   NODE_ENV=staging NODE_PATH=./src npm run build
  //   mv build ../auth/public
  //   cd ../auth
  //   cp public/index.html views/index.ejs
  //   echo "> done!"
  // )
}

const deployScript = () => isCommandAvailable('ansible-playbook') &&
  spawnSync('ansible-playbook', ['-v', 'deploy/update.yml'], { stdio: 'inherit' })

const deployInitScript = () => {
  const pkg = JSON.parse(fs.readFileSync('./package.json'))
  try {
    const dockerCompose = fs.readFileSync('./docker/docker-compose.yml').toString()
    const dockerComposeProd = replaceAll(dockerCompose, 'build: \.', `image: registry.jorgeadolfo.com/${pkg.name}:latest`)
    fs.writeFileSync('./docker/docker-compose.prod.yml', dockerComposeProd)
    
    console.log(` creating ${pkg.name} in the remote server`)
    execSync(`ssh jorgeadolfo.com "mkdir /opt/g3org3/${pkg.name}" 2> /dev/null`)
    
    console.log(' transfering file to server')
    execSync(`scp ./docker/docker-compose.prod.yml jorgeadolfo.com:/opt/g3org3/${pkg.name}/docker-compose.yml`)
    execSync('rm ./docker/docker-compose.prod.yml')
    console.log(' ✨ done')
  } catch (err) {
    if (err.message.trim().split('\n')[0].indexOf(`mkdir`) === -1)
      console.log('You are missing the docker-compose file')
    else {
      console.log(`The folder is already created.`)
      enquirer.ask([{
        type: 'confirm',
        default: true,
        message: 'Do you want to replace the docker-compose',
        name: 'replace'
      }]).then(response => {
        if (response.replace) {
          console.log(' transfering file to server')
          execSync(`scp ./docker/docker-compose.prod.yml jorgeadolfo.com:/opt/g3org3/${pkg.name}/docker-compose.yml`)
          execSync('rm ./docker/docker-compose.prod.yml')
          console.log(' ✨ done')
        }
      })
    }
  }
}

const isFileAvailable = (filepath, cwd = '.') => {
  try {
    return fs.readFileSync(`${cwd}/${filepath}`)
  } catch (err) {
    return false
  }
}

const dockerComposeRun = (flag) => {
  if (isDockerStuffIsAvailable()) {
    spawnSync('docker-compose', ['-f', 'docker/docker-compose.yml', 'up', '-d'], { stdio: 'inherit' })
    spawnSync('docker-compose', ['-f', 'docker/docker-compose.yml', 'logs', '-f'], { stdio: 'inherit' })
  }
}
const dockerStop = () => isDockerStuffIsAvailable() &&
  spawnSync('docker-compose', ['-f', 'docker/docker-compose.yml', 'stop'], { stdio: 'inherit' })

const dockerBuildScript = (flag) => {
  const pkgJSON = isFileAvailable('package.json')
  if (pkgJSON) {
    const pkg = JSON.parse(pkgJSON)
    const pkgStr = JSON.stringify({ name: pkg.name, dependencies: pkg.dependencies }, null, 2)
    fs.writeFileSync('./.pre-package.json', pkgStr)
    spawnSync('python', [pkgPy], { stdio: 'inherit' })
    if (flag === '-f') {
      const image = `registry.jorgeadolfo.com/${pkg.name}:dev`
      spawnSync('docker', ['build', '-f', 'docker/Dockerfile', '-t', image, '.'], { stdio: 'inherit' })
    } else {
      enquirer.ask([{
        type: 'input',
        name: 'registry',
        default: `registry.jorgeadolfo.com`,
        message: 'What is the image name'
      }, {
        type: 'radio',
        name: 'version',
        default: 'dev',
        choices: [
          'latest',
          'dev',
          pkg.version,
        ],
        message: 'Build current version or latest tag'
      }]).then(answers => {
        const image = `${answers.registry}/${pkg.name}:${answers.version}`
        spawnSync('docker', ['build', '-f', 'docker/Dockerfile', '-t', image, '.'], { stdio: 'inherit' })
      })
    }
  } else {
    console.log('no node project detected here 🤔')
  }
}

const args = process.argv.slice(2)
const cmd = args[0]
const flag = args.lenth > 1 ? args[1] : ''
switch (cmd) {
  case 'lint': {
    process.exit(lintScript().status)
    break
  }
  case 'format': {
    process.exit(formatScript(true).status)
    break
  }
  case 'test': {
    process.exit(testScript().status)
    break
  }
  case 'coverage': {
    testScript({ coverage: true })
    break
  }
  case 'test:w': {
    testScript({ watch: true })
    break
  }
  case 'lint-different': {
    process.exit(formatScript().status)
    break
  }
  case 'docker-run': {
    dockerComposeRun(flag)
    break
  }
  case 'docker-stop': {
    dockerStop()
    break
  }
  case 'docker-push': {
    dockerPushScript()
    break
  }
  case 'docker-build': {
    dockerBuildScript(flag)
    break
  }
  case 'deploy': {
    deployScript()
    break
  }
  case 'deploy-init': {
    deployInitScript()
    break
  }
  default:
    console.log(`Unknown command "${cmd}".`)
    process.exit(1)
}
