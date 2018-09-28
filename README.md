# iwashi-lang-js

[![Build Status][travis-img]][travis-url]
[![Coverage Status][codecov-img]][codecov-url]
[![Greenkeeper badge](https://badges.greenkeeper.io/hakatashi/iwashi-lang-js.svg)](https://greenkeeper.io/)

[travis-img]: https://travis-ci.org/hakatashi/iwashi-lang-js.svg?branch=master
[travis-url]: https://travis-ci.org/hakatashi/iwashi-lang-js
[codecov-img]: https://codecov.io/gh/hakatashi/iwashi-lang-js/branch/master/graphs/badge.svg
[codecov-url]: https://codecov.io/gh/hakatashi/iwashi-lang-js/branch/master

JavaScript implementation of [iwashi lang](https://github.com/Yosshi999/iwashi-lang)

## Usage

```js
const Iwashi = require('iwashi');
const iwashi = new Iwashi([
	'ビルにあながあく',
	'だれかがハサミで',
	'めがみえなくなってきた',
	'イワシがつちからはえてくるんだ',
	'めがみえなくなってきた',
	'タイムラインをちょんぎった',
	'ビルがつちからはえてくるんだ',
	'イワシにあながあく',
].join('\n'));

iwashi.stream.end('hoge');
iwashi.run();

const concat = require('concat-stream');
iwashi.stream.pipe(concat((data) => {
	console.log(data); //=> 'hoge';
}));
```
