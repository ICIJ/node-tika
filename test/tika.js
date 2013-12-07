/*jshint node:true*/
/*global test, suite, setup, teardown*/

'use strict';

var assert = require('assert');
var tika = require('../');

suite('document tests', function() {
	test('extract from txt', function(done) {
		tika.getText('test/data/file.txt', null, function(err, text) {
			assert.ifError(err);
			assert.equal(text, 'Just some text.\n\n');
			done();
		});
	});

	test('extract from extensionless txt', function(done) {
		tika.getText('test/data/extensionless/txt', null, function(err, text) {
			assert.ifError(err);
			assert.equal(text, 'Just some text.\n\n');
			done();
		});
	});

	test('extract from doc', function(done) {
		tika.getText('test/data/file.doc', null, function(err, text) {
			assert.ifError(err);
			assert.equal(text, 'Just some text.\n');
			done();
		});
	});

	test('extract from extensionless doc', function(done) {
		tika.getText('test/data/extensionless/doc', null, function(err, text) {
			assert.ifError(err);
			assert.equal(text, 'Just some text.\n');
			done();
		});
	});

	test('extract from docx', function(done) {
		tika.getText('test/data/file.docx', null, function(err, text) {
			assert.ifError(err);
			assert.equal(text, 'Just some text.\n');
			done();
		});
	});

	test('extract from extensionless docx', function(done) {
		tika.getText('test/data/extensionless/docx', null, function(err, text) {
			assert.ifError(err);
			assert.equal(text, 'Just some text.\n');
			done();
		});
	});

	test('extract from pdf', function(done) {
		tika.getText('test/data/file.pdf', null, function(err, text) {
			assert.ifError(err);
			assert.equal(text.trim(), 'Just some text.');
			done();
		});
	});

	test('extract from extensionless pdf', function(done) {
		tika.getText('test/data/extensionless/pdf', null, function(err, text) {
			assert.ifError(err);
			assert.equal(text.trim(), 'Just some text.');
			done();
		});
	});

	test('extract from protected pdf', function(done) {
		tika.getText('test/data/protected/file.pdf', null, function(err, text) {
			assert.ifError(err);
			assert.equal(text.trim(), 'Just some text.');
			done();
		});
	});
});

suite('obscure document tests', function() {
	test('extract from Word 2003 XML', function(done) {
		tika.getText('test/data/obscure/word2003.xml', null, function(err, text) {
			assert.ifError(err);
			assert.ok(-1 !== text.indexOf('Just some text.'));
			assert.ok(-1 === text.indexOf('<?xml'));
			done();
		});
	});
});

suite('structured data tests', function() {
	test('extract from plain XML', function(done) {
		tika.getText('test/data/structured/plain.xml', null, function(err, text) {
			assert.ifError(err);
			assert.ok(-1 !== text.indexOf('Just some text.'));
			assert.ok(-1 === text.indexOf('<?xml'));
			done();
		});
	});
});

suite('image tests', function() {
	test('extract from png', function(done) {
		tika.getText('test/data/file.png', null, function(err, text) {
			assert.ifError(err);
			assert.equal(text, '');
			done();
		});
	});

	test('extract from extensionless png', function(done) {
		tika.getText('test/data/extensionless/png', null, function(err, text) {
			assert.ifError(err);
			assert.equal(text, '');
			done();
		});
	});

	test('extract from gif', function(done) {
		tika.getText('test/data/file.gif', null, function(err, text) {
			assert.ifError(err);
			assert.equal(text, '');
			done();
		});
	});

	test('extract from extensionless gif', function(done) {
		tika.getText('test/data/extensionless/gif', null, function(err, text) {
			assert.ifError(err);
			assert.equal(text, '');
			done();
		});
	});
});

suite('non-utf8 encoded document tests', function() {
	test('extract Windows Latin 1 text', function(done) {
		tika.getText('test/data/nonutf8/windows-latin1.txt', null, function(err, text) {
			assert.ifError(err);
			assert.equal(text, 'Algún pequeño trozo de texto.\n\n');
			done();
		});
	});

	test('extract UTF-16 English-language text', function(done) {
		tika.getText('test/data/nonutf8/utf16-english.txt', null, function(err, text) {
			assert.ifError(err);
			assert.equal(text, 'Just some text.\n\n');
			done();
		});
	});

	test('extract UTF-16 Chinese (Simplified) text', function(done) {
		tika.getText('test/data/nonutf8/utf16-chinese.txt', null, function(err, text) {
			assert.ifError(err);
			assert.equal(text, '只是一些文字。\n\n');
			done();
		});
	});
});

suite('error handling tests', function() {
	test('extract from encrypted doc', function(done) {
		tika.getText('test/data/encrypted/file.doc', null, function(err, text) {
			assert.ok(err);
			assert.ok(-1 !== err.toString().indexOf('EncryptedDocumentException: Cannot process encrypted word file'));
			done();
		});
	});

	test('extract from encrypted pdf', function(done) {
		tika.getText('test/data/encrypted/file.pdf', null, function(err, text) {
			assert.ok(err);
			assert.ok(-1 !== err.toString().indexOf('WrappedIOException: Error decrypting document'));
			done();
		});
	});
});
