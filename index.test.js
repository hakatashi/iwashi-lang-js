/* eslint-env jest */

const {stripIndent} = require('common-tags');
const Iwashi = require('./index.js');

describe('iwashi', () => {
	test('works', () => {
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
		expect(iwashi.lines.length).toEqual(8);
	});
});
