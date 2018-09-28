const EventEmitter = require('events');
const {Duplex} = require('stream');

module.exports = class Iwashi extends EventEmitter {
	constructor(program) {
		super();

		if (typeof program !== 'string') {
			throw new Error(`program should be string, got ${typeof program}`);
		}

		this.compile(program);
		this.isEnded = false;
		this.isInputClose = false;

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
			final: () => {
				this.isInputClose = true;
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
				const c = this.buffer[0];
				this.buffer = this.buffer.slice(1);
				resolve(c);
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
	}

	async run() {
		let pc = 0;
		const memory = Buffer.alloc(3000);
		let pointer = 0;

		while (pc < this.commands.length) {
			const [opcode, arg] = this.commands[pc];

			if (opcode === 'GETC') {
				memory[pointer] = await this.getc()
			} else if (opcode === 'PUTC') {
				this.putc(memory[pointer]);
			}

			pc++;
		}

		this.isEnded = true;
		this.stream.push(null);
	}
};
