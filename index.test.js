/* eslint-env jest */

const fs = require('fs');
const {promisify} = require('util');
const concat = require('concat-stream');
const Iwashi = require('./index.js');

describe('cat.iwashi', () => {
	let iwashi = null;

	beforeEach(async () => {
		const code = await promisify(fs.readFile)('iwashi-lang/example/cat.iwashi');
		iwashi = new Iwashi(code.toString());
	});

	test('works', async () => {
		expect(iwashi.commands).toEqual([
			['NOP'],
			['GETC'],
			['NEG'],
			['JGZ', 'イワシ'],
			['NEG'],
			['PUTC'],
			['JGZ', 'ビル'],
			['NOP'],
		]);
		expect(iwashi.labels.get('ビル')).toEqual(0);
		expect(iwashi.labels.get('イワシ')).toEqual(7);

		await new Promise((resolve) => {
			iwashi.stream.end('hoge');
			iwashi.stream.pipe(concat((data) => {
				expect(data.toString()).toEqual('hoge');
				resolve();
			}));
			iwashi.run();
		});
	});
});

describe('hello.iwashi', () => {
	let iwashi = null;

	beforeEach(async () => {
		const code = await promisify(fs.readFile)('iwashi-lang/example/hello.iwashi');
		iwashi = new Iwashi(code.toString());
	});

	test('works', async () => {
		await new Promise((resolve) => {
			iwashi.stream.pipe(concat((data) => {
				expect(data.toString()).toEqual('Hello, World!\n');
				resolve();
			}));
			iwashi.run();
		});
	});
});
