const EventEmitter = require('events');

module.exports = class Iwashi extends EventEmitter {
	constructor(program) {
		super();
		this.lines = program.trim().split(/\r?\n/);
	}
};
