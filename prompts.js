const colors = require('colors/safe');

module.exports = {
	properties: {
		discordToken: {
			message: colors.green('Paste here your Discord token'),
			required: true,
			warning: 'You must paste your Discord token'
		},
		prefix: {
			message: colors.green('Type the prefix you\'d like to use to interact with Kuro'),
			required: true,
			default: '!',
			warning: 'You must set a prefix of at least 1 character'
		},
		mal: {
			message: colors.green('If you have a MyAnimeList username then type it'),
			required: false,
			default: ''
		},
		pm2: {
			message: colors.green('Would you like to install pm2 globally, so you can close the terminal window and have Kuro work in the background as well as restart if there\'s an error? (recommended)'),
			required: true,
			validator: /y[es]*|n[o]?/,
			warning: 'You must answer with yes or no',
			default: 'yes'
		},
		confirm: {
			message: colors.green('Save this data to the config file?'),
			required: true,
			validator: /y[es]*|n[o]?/,
			warning: 'You must answer with yes or no',
			default: 'yes'
		}
	}
}
