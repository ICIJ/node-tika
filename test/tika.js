/*jshint node:true*/
/*global test, suite, setup, teardown*/

'use strict';

var assert = require('assert');
var tika = require('../');

suite('document tests', function() {
	test('extract from txt', function(done) {
		tika.text('test/data/file.txt', null, function(err, text) {
			assert.ifError(err);
			assert.equal(text, 'Just some text.\n\n');
			done();
		});
	});

	test('extract from extensionless txt', function(done) {
		tika.text('test/data/extensionless/txt', null, function(err, text) {
			assert.ifError(err);
			assert.equal(text, 'Just some text.\n\n');
			done();
		});
	});

	test('extract from doc', function(done) {
		tika.text('test/data/file.doc', null, function(err, text) {
			assert.ifError(err);
			assert.equal(text, 'Just some text.\n');
			done();
		});
	});

	test('extract from extensionless doc', function(done) {
		tika.text('test/data/extensionless/doc', null, function(err, text) {
			assert.ifError(err);
			assert.equal(text, 'Just some text.\n');
			done();
		});
	});

	test('extract from docx', function(done) {
		tika.text('test/data/file.docx', null, function(err, text) {
			assert.ifError(err);
			assert.equal(text, 'Just some text.\n');
			done();
		});
	});

	test('extract from extensionless docx', function(done) {
		tika.text('test/data/extensionless/docx', null, function(err, text) {
			assert.ifError(err);
			assert.equal(text, 'Just some text.\n');
			done();
		});
	});

	test('extract from pdf', function(done) {
		tika.text('test/data/file.pdf', null, function(err, text) {
			assert.ifError(err);
			assert.equal(text.trim(), 'Just some text.');
			done();
		});
	});

	test('extract from extensionless pdf', function(done) {
		tika.text('test/data/extensionless/pdf', null, function(err, text) {
			assert.ifError(err);
			assert.equal(text.trim(), 'Just some text.');
			done();
		});
	});

	test('extract from protected pdf', function(done) {
		tika.text('test/data/protected/file.pdf', null, function(err, text) {
			assert.ifError(err);
			assert.equal(text.trim(), 'Just some text.');
			done();
		});
	});
});

suite('obscure document tests', function() {
	test('extract from Word 2003 XML', function(done) {
		tika.text('test/data/obscure/word2003.xml', null, function(err, text) {
			assert.ifError(err);
			assert.ok(-1 !== text.indexOf('Just some text.'));
			assert.ok(-1 === text.indexOf('<?xml'));
			done();
		});
	});
});

suite('structured data tests', function() {
	test('extract from plain XML', function(done) {
		tika.text('test/data/structured/plain.xml', null, function(err, text) {
			assert.ifError(err);
			assert.ok(-1 !== text.indexOf('Just some text.'));
			assert.ok(-1 === text.indexOf('<?xml'));
			done();
		});
	});
});

suite('image tests', function() {
	test('extract from png', function(done) {
		tika.text('test/data/file.png', null, function(err, text) {
			assert.ifError(err);
			assert.equal(text, '');
			done();
		});
	});

	test('extract from extensionless png', function(done) {
		tika.text('test/data/extensionless/png', null, function(err, text) {
			assert.ifError(err);
			assert.equal(text, '');
			done();
		});
	});

	test('extract from gif', function(done) {
		tika.text('test/data/file.gif', null, function(err, text) {
			assert.ifError(err);
			assert.equal(text, '');
			done();
		});
	});

	test('extract from extensionless gif', function(done) {
		tika.text('test/data/extensionless/gif', null, function(err, text) {
			assert.ifError(err);
			assert.equal(text, '');
			done();
		});
	});
});

suite('non-utf8 encoded document tests', function() {
	test('extract Windows Latin 1 text', function(done) {
		tika.text('test/data/nonutf8/windows-latin1.txt', null, function(err, text) {
			assert.ifError(err);
			assert.equal(text, 'Algún pequeño trozo de texto.\n\n');
			done();
		});
	});

	test('extract UTF-16 English-language text', function(done) {
		tika.text('test/data/nonutf8/utf16-english.txt', null, function(err, text) {
			assert.ifError(err);
			assert.equal(text, 'Just some text.\n\n');
			done();
		});
	});

	test('extract UTF-16 Chinese (Simplified) text', function(done) {
		tika.text('test/data/nonutf8/utf16-chinese.txt', null, function(err, text) {
			assert.ifError(err);
			assert.equal(text, '\u53ea\u662f\u4e00\u4e9b\u6587\u5b57\u3002\n\n');
			done();
		});
	});
});

suite('archive tests', function() {
	test('compressed archive test', function(done) {
		tika.text('test/data/archive/files.zip', null, function(err, text) {
			assert.ifError(err);
			assert.equal(text.trim(), 'file1.txt\nSome text 1.\n\n\n\n\nfile2.txt\nSome text 2.\n\n\n\n\nfile3.txt\nSome text 3.');
			done();
		});
	});

	test('twice compressed archive test', function(done) {
		tika.text('test/data/archive/files-files.zip', null, function(err, text) {
			assert.ifError(err);
			assert.equal(text.trim(), 'file4.txt\nSome text 4.\n\n\n\n\nfile5.txt\nSome text 5.\n\n\n\n\nfile6.txt\nSome text 6.\n\n\n\n\nfiles.zip\n\n\nfile1.txt\n\nSome text 1.\n\n\n\n\n\n\n\nfile2.txt\n\nSome text 2.\n\n\n\n\n\n\n\nfile3.txt\n\nSome text 3.');
			done();
		});
	});
});

suite('error handling tests', function() {
	test('extract from encrypted doc', function(done) {
		tika.text('test/data/encrypted/file.doc', null, function(err, text) {
			assert.ok(err);
			assert.ok(-1 !== err.toString().indexOf('EncryptedDocumentException: Cannot process encrypted word file'));
			done();
		});
	});

	test('extract from encrypted pdf', function(done) {
		tika.text('test/data/encrypted/file.pdf', null, function(err, text) {
			assert.ok(err);
			assert.ok(-1 !== err.toString().indexOf('WrappedIOException: Error decrypting document'));
			done();
		});
	});
});
