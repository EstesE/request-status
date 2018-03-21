const chalk = require('chalk');
const request = require('request');
const async = require('async');

let urls = [];

let q = async.queue((options, callback) => {
	function Go(options, s, other) {
		request.get(options, function(error, response, body) {
			if (response) {
				if(response.statusCode === 200) {
					if (s.length === 0) { s = options.url; }
					if (other === true) {
						s = `${s} --> ${response.request.href} - ${chalk.green(response.statusCode)}`;
					} else {
						s = `${s} - ${chalk.green(response.statusCode)}`;
					}
					console.log(s);
					other = false;
					s = '';
					callback();
				} else if (response.statusCode.toString().indexOf('30') > -1) {
					let m = '';
					let newOptions = {
						url: options.url,
						followRedirect: true,
						timeout: options.timeout
					}
					if (response.statusCode > 301) {
						// m = `${newOptions.url} - ${chalk.magenta(response.statusCode)} --> ${newOptions.url}${response.headers.location}`;
						if (response.headers.location.indexOf('http://') === -1 && response.headers.location.indexOf('https://') === -1) {
							m = `${newOptions.url} - ${chalk.magenta(response.statusCode)} --> ${newOptions.url}${response.headers.location}`;
							newOptions.url = newOptions.url + response.headers.location;
						} else {
							m = `${newOptions.url} - ${chalk.magenta(response.statusCode)} --> ${response.headers.location}`;
							newOptions.url = response.headers.location; //newOptions.url;
						}
						other = true;
					} else {
						m = `${newOptions.url} - ${chalk.yellow(response.statusCode)} --> ${response.headers.location}`;
						newOptions.url = response.headers.location;
					}
					Go(newOptions, m, other);
				} else {
					console.log(`${options.url} - ${chalk.red.bold(response.statusCode)}`);
					s = '';
					other = false;
					callback();
				}
			} else {
				if (error.code) {
					console.log(`${options.url} - ${chalk.red(error.code)}`);
				} else {
					// console.log(`${options.url} - ${chalk.red(error.message)}`);
					console.log(`${s} - ${chalk.red(error.message)}`);
				}
				s = '';
				other = false;
				callback();
			}
		}).setMaxListeners(10);
	}
	Go(options, s, other);
}, 1);

q.drain = () => {
	console.log('finished');
};

let s = '';
let other = false;
for (let i = 0; i < urls.length; i++) {
	let options = {
		url: urls[i],
		followRedirect: false,
		timeout: 5000
	}
	q.push(options);
}
