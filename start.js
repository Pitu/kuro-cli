#! /usr/bin/env node
const shell = require('shelljs')
const prompt = require('prompt')
const sudo = require('sudo-prompt')
const prompts = require('./prompts.js')
const colors = require('colors/safe')
const fs = require('fs')
const path = require('path')

shell.cd(path.resolve(process.cwd()))
checkForKuroInstall()

function checkForKuroInstall() {
	if (!fs.existsSync(path.join(__dirname, 'kuro', 'kuro.js'))) {
		console.log(' ')
		console.log(colors.green(':: Installing Kuro ::'))
		console.log(' ')
		shell.exec('git clone git://github.com/kanadeko/kuro.git')
		return setupKuroForTheFirstTime()
	}

	return checkForUpdates(false)
}

function checkForUpdates(comingFromInstall) {
	console.log(colors.green(':: Checking for updates ::'))

	// Enter Kuro directory if not coming from install
	if (comingFromInstall) {
		console.log(' ')
		console.log(colors.green(':: Kuro has been installed to ' + path.resolve(process.cwd()) + ' ::'))
		shell.cd('kuro')
	}

	// Check for updates on Kuro
	shell.exec('git pull')

	console.log(' ')
	console.log(colors.green(':: Checking for dependency updates ::'))
	shell.exec('npm update')

	if (fs.existsSync(path.join(__dirname, 'pm2'))) {
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
		telegramNotifications: {
			active: false,
			botToken: 'YOUR-TELEGRAM-BOT-TOKEN',
			userId: 'The user id your Telegram token should send a mesage to'
		},
		embedColor: 15473237,
		database: {
			client: 'sqlite3',
			connection: { filename: './db' },
			useNullAsDefault: true
		}
	}

	fs.writeFile(path.join(__dirname, 'kuro', 'config.json'), JSON.stringify(config, null, '\t'), 'utf-8', (err) => {
	// fs.writeFile(`config.js`, config, 'utf8', (err) => {
		if (err) throw err;
		console.log(' ')
		console.log(colors.green(':: Basic Kuro setup is done ::'))
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
		fs.closeSync(fs.openSync(path.join(__dirname, 'pm2'), 'w'))
		shell.cd('kuro')
		shell.exec('pm2 start kuro.js')
		return checkForUpdates(true)
	});
}
