#! /usr/bin/env node
const shell = require('shelljs')
const prompt = require('prompt')
const sudo = require('sudo-prompt')
const prompts = require('./prompts.js')
const colors = require('colors/safe')
const fs = require('fs')
const path = require('path')
const homeDir = require('os').homedir()
const kuroDir = path.join(homeDir, 'kuro')

shell.cd(path.resolve(process.cwd()))
checkForKuroInstall()

function checkForKuroInstall() {
	if (!fs.existsSync(kuroDir)) {
		console.log(' ')
		console.log(colors.green(':: Installing Kuro ::'))
		console.log(' ')
		shell.cd(homeDir)
		shell.exec('git clone git://github.com/kanadeko/kuro.git')
		return setupKuroForTheFirstTime()
	}

	return checkForUpdates(false)
}

function checkForUpdates(comingFromInstall) {
	console.log(colors.green(':: Checking for updates ::'))

	if (comingFromInstall) {
		console.log(' ')
		console.log(colors.green(`:: Kuro has been installed to ${kuroDir} ::`))
	}

	shell.cd(kuroDir)

	// Check for updates on Kuro
	shell.exec('git pull')

	console.log(' ')
	console.log(colors.green(':: Checking for dependency updates ::'))
	shell.exec('npm update')

	if (fs.existsSync(path.join(kuroDir, 'pm2.e'))) {
		shell.exec('pm2 restart kuro')
		console.log(' ')
		console.log(colors.green(':: Kuro started via PM2, you can now close this window! ::'))
		process.exit()
	} else {
		shell.exec('node kuro.js')
	}
}

function setupKuroForTheFirstTime() {
	console.log(colors.green(':: Installing dependencies ::'))

	shell.cd(kuroDir)
	shell.exec('npm install')
	prompt.start()
	prompt.message = ''

	console.log(' ')
	console.log(colors.green(':: Let\'s configure Kuro ::'))
	console.log(' ')
	prompt.get(prompts, (err, result) => {
		if (err) {
			console.error(err)
			return process.exit(1)
		}
		if (result.confirm === 'yes' || result.confirm === 'y') {
			return buildConfigFile(result)
		}
		console.log(' ')
		console.log(colors.red(':: You decided not to save your data. Either run this tool again or modify it manually by editing the config.js file in Kuro ::'))
		return process.exit()
	});
}

function buildConfigFile(result) {
	let config = {
		token: result.discordToken,
		prefix: result.prefix,
		MALusername: result.mal,
		commandError: {
			sendToModule: true,
			module: 's',
			function: 'run'
		},
		embedColor: 15473237
	}

	fs.writeFile(path.join(kuroDir, 'config.json'), JSON.stringify(config, null, '\t'), 'utf-8', (err) => {
	// fs.writeFile(`config.js`, config, 'utf8', (err) => {
		if (err) throw err;
		console.log(' ')
		console.log(colors.green(':: Kuro setup is done ::'))
		if (result.pm2 === 'yes' || result.pm2 === 'y') {
			return installPM2()
		}
		return checkForUpdates(true)
	})
}

function installPM2() {
	console.log(' ')
	console.log(colors.green(':: Installing PM2 ::'))
	var options = { name: 'Kuro' }
	sudo.exec('npm i -g pm2', options, (error, stdout, stderr) => {
		if (error) return checkForUpdates(true)

		// Create empty pm2 file so the cli knows we have it installed
		fs.closeSync(fs.openSync(path.join(kuroDir, 'pm2.e'), 'w'))
		shell.cd(kuroDir)
		shell.exec('pm2 start kuro.js')
		shell.exec('pm2 save')
		return checkForUpdates(true)
	});
}
