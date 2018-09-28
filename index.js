const EventEmitter = require('events');
const {Duplex} = require('stream');
const assert = require('assert');

module.exports = class Iwashi extends EventEmitter {
	constructor(program) {
		super();

		if (typeof program !== 'string') {
			throw new Error(`program should be string, got ${typeof program}`);
		}

		this.compile(program);
		this.isEnded = false;
		this.isInputClose = false;

		this.pc = 0;
		this.pointer = 0;
		this.memory = new Array(2020).fill(0);

		this.buffer = Buffer.from([]);
		this.stream = new Duplex({
			read: () => {
				if (this.isEnded) {
					this.stream.push(null);
				}
			},
			write: (chunk, encoding, callback) => {
				this.buffer = Buffer.concat([this.buffer, Buffer.from(chunk)]);
				this.emit('_data');
				callback();
			},
			final: (callback) => {
				this.isInputClose = true;
				this.emit('_data');
				callback();
			},
		});
	}

	async getc() {
		if (this.buffer.length > 0) {
			const char = this.buffer[0];
			this.buffer = this.buffer.slice(1);
			return char;
		}

		if (this.isInputClose) {
			return -1;
		}

		const char = await new Promise((resolve) => {
			this.once('_data', () => {
				if (this.buffer.length > 0) {
					const c = this.buffer[0];
					this.buffer = this.buffer.slice(1);
					resolve(c);
				}
				resolve(-1);
			});
		});

		return char;
	}

	async getn() {
		// Read until newline or EOF
		const buffers = [];
		while (true) {
			const char = await this.getc();
			if (char === '\n' || char === -1) {
				break;
			}
			if (char === '\r') {
				this.getc();
				break;
			}
			buffers.push(char);
		}

		const string = buffers.map((char) => String.fromCharCode(char)).join('');
		if (string.length === 0 || !string.match(/^\d+$/)) {
			throw new Error(`Invalid number: "${string}"`);
		}

		return parseInt(string);
	}

	putc(char) {
		this.stream.push(Buffer.from([char]), 'binary');
	}

	putn(number) {
		const string = number.toString();
		this.stream.push(Buffer.from(string, 'ascii'), 'binary');
	}

	compile(program) {
		const lines = program.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length > 0);

		this.commands = [];
		this.labels = new Map();

		let matches = null;
		for (const line of lines) {
			if (line === 'だれかがハサミで') {
				this.commands.push(['GETC']);
			} else if (line === 'タイムラインをちょんぎった') {
				this.commands.push(['PUTC']);
			} else if (line === 'そして') {
				this.commands.push(['GETN']);
			} else if (line === 'あしたときのうがつながった') {
				this.commands.push(['PUTN']);
			} else if (line === 'あしたのことはしっている') {
				this.commands.push(['INC']);
			} else if ((matches = line.match(/^(.+)がつちからはえてくるんだ$/))) {
				this.commands.push(['JGZ', matches[1]]);
			} else if ((matches = line.match(/^(.+)にあながあく$/))) {
				this.commands.push(['NOP']);
				this.labels.set(matches[1], this.commands.length - 1);
			} else if (line === 'すのこがきえるんだ') {
				this.commands.push(['DEC']);
			} else if (line === 'きのうのきおくはきえたけど') {
				this.commands.push(['ZERO']);
			} else if (line === 'きえたってこともよくわからないんだ') {
				this.commands.push(['EXIT']);
			} else if ((matches = line.match(/^そらのうえから(.+)がたつ$/))) {
				this.commands.push(['JZ', matches[1]]);
			} else if (line === 'めがみえなくなってきた') {
				this.commands.push(['NEG']);
			} else if (line === 'はなはかれず') {
				this.commands.push(['ADD']);
			} else if (line === 'とりはとばずねむる') {
				this.commands.push(['SUB']);
			} else if (line === 'かぜはとまりつめたく') {
				this.commands.push(['MUL']);
			} else if (line === 'つきはみちもかけもせずまわる') {
				this.commands.push(['DIV']);
			} else if ((matches = line.match(/^(\d+)ねんまえかのことでした$/))) {
				const age = parseInt(matches[1]);
				if (!Number.isNaN(age) && age >= 0 && age <= 2018) {
					this.commands.push(['FOCUS', age]);
				} else {
					throw new Error(`そんな時代はない: ${matches[1]}`);
				}
			} else {
				throw new Error(`そんな命令はない: ${line}`);
			}
		}

		for (const command of this.commands) {
			const [opcode, label] = command;
			if (opcode === 'JGZ' || opcode === 'JZ') {
				if (!this.labels.has(label)) {
					throw new Error(`Invalid Label: ${label}`);
				}
			}
		}
	}

	async run() {
		while (this.pc < this.commands.length) {
			const isExit = await this.step();
			if (isExit) {
				break;
			}
		}

		this.isEnded = true;
		this.stream.push(null);
	}

	async step() {
		const [opcode, arg] = this.commands[this.pc];

		assert(this.pointer >= 0);
		assert(this.pointer < this.memory.length);

		if (opcode === 'GETC') {
			this.memory[this.pointer] = await this.getc();
		} else if (opcode === 'PUTC') {
			this.putc(this.memory[this.pointer]);
		} else if (opcode === 'GETN') {
			this.memory[this.pointer] = await this.getn();
		} else if (opcode === 'PUTN') {
			this.putn(this.memory[this.pointer]);
		} else if (opcode === 'INC') {
			this.memory[this.pointer]++;
		} else if (opcode === 'DEC') {
			this.memory[this.pointer]--;
		} else if (opcode === 'JGZ') {
			if (this.memory[this.pointer] > 0) {
				const address = this.labels.get(arg);
				assert(address !== undefined);
				this.pc = address;
				return false;
			}
		} else if (opcode === 'JZ') {
			if (this.memory[this.pointer] === 0) {
				const address = this.labels.get(arg);
				assert(address !== undefined);
				this.pc = address;
				return false;
			}
		} else if (opcode === 'ZERO') {
			this.memory[this.pointer] = 0;
		} else if (opcode === 'NEG') {
			this.memory[this.pointer] *= -1;
		} else if (opcode === 'ADD') {
			const a = this.memory[this.pointer + 1] || 0;
			const b = this.memory[this.pointer + 2] || 0;
			this.memory[this.pointer] = a + b;
		} else if (opcode === 'SUB') {
			const a = this.memory[this.pointer + 1] || 0;
			const b = this.memory[this.pointer + 2] || 0;
			this.memory[this.pointer] = a - b;
		} else if (opcode === 'MUL') {
			const a = this.memory[this.pointer + 1] || 0;
			const b = this.memory[this.pointer + 2] || 0;
			this.memory[this.pointer] = a * b;
		} else if (opcode === 'DIV') {
			const a = this.memory[this.pointer + 1] || 0;
			const b = this.memory[this.pointer + 2] || 0;

			if (b === 0) {
				throw new Error('ZeroDivisionError');
			}

			this.memory[this.pointer] = Math.floor(a / b);
			if (this.pointer + 1 < this.memory.length) {
				this.memory[this.pointer] = ((a % b) + b) % b;
			}
		} else if (opcode === 'FOCUS') {
			this.pointer = arg;
		} else if (opcode === 'EXIT') {
			return true;
		}

		this.pc++;
		return false;
	}
};
