/* eslint-env jest */

const {stripIndent} = require('common-tags');
const concat = require('concat-stream');
const Iwashi = require('./index.js');

describe('iwashi', () => {
	test('works', async () => {
		const iwashi = new Iwashi(stripIndent`
			ビルにあながあく
			だれかがハサミで
			めがみえなくなってきた
			イワシがつちからはえてくるんだ
			めがみえなくなってきた
			タイムラインをちょんぎった
			ビルがつちからはえてくるんだ
			イワシにあながあく
		`);

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
			iwashi.stream.pipe(concat((data) => {
				expect(data.toString()).toEqual('hoge');
				resolve();
			}));
		});
	});
});
