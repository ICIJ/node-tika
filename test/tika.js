/*jshint node:true*/
/*global test, suite, setup, teardown*/

'use strict';

var assert = require('assert');
var tika = require('../');

suite('document tests', function() {
	test('detect txt content-type', function(done) {
		tika.type('test/data/file.txt', function(err, contentType) {
			assert.ifError(err);
			assert.equal(typeof contentType, 'string');
			assert.equal(contentType, 'text/plain');
			done();
		});
	});

	test('detect txt content-type and charset', function(done) {
		tika.typeAndCharset('test/data/file.txt', function(err, contentType) {
			assert.ifError(err);
			assert.equal(typeof contentType, 'string');
			assert.equal(contentType, 'text/plain; charset=ISO-8859-1');
			done();
		});
	});

	test('extract from txt', function(done) {
		tika.text('test/data/file.txt', function(err, text) {
			assert.ifError(err);
			assert.equal(typeof text, 'string');
			assert.equal(text, 'Just some text.\n\n');
			done();
		});
	});

	test('extract meta from txt', function(done) {
		tika.meta('test/data/file.txt', function(err, meta) {
			assert.ifError(err);
			assert.ok(meta);
			assert.equal(typeof meta.resourceName[0], 'string');
			assert.deepEqual(meta.resourceName, ['file.txt']);
			assert.deepEqual(meta['Content-Type'], ['text/plain; charset=ISO-8859-1']);
			assert.deepEqual(meta['Content-Encoding'], ['ISO-8859-1']);
			done();
		});
	});

	test('extract meta and text from txt', function(done) {
		tika.extract('test/data/file.txt', function(err, text, meta) {
			assert.ifError(err);
			assert.equal(typeof text, 'string');
			assert.equal(text, 'Just some text.\n\n');
			assert.ok(meta);
			assert.equal(typeof meta.resourceName[0], 'string');
			assert.deepEqual(meta.resourceName, ['file.txt']);
			assert.deepEqual(meta['Content-Type'], ['text/plain; charset=ISO-8859-1']);
			assert.deepEqual(meta['Content-Encoding'], ['ISO-8859-1']);
			done();
		});
	});

	test('extract from extensionless txt', function(done) {
		tika.text('test/data/extensionless/txt', function(err, text) {
			assert.ifError(err);
			assert.equal(text, 'Just some text.\n\n');
			done();
		});
	});

	test('extract from doc', function(done) {
		tika.text('test/data/file.doc', function(err, text) {
			assert.ifError(err);
			assert.equal(text, 'Just some text.\n');
			done();
		});
	});

	test('extract meta from doc', function(done) {
		tika.meta('test/data/file.doc', function(err, meta) {
			assert.ifError(err);
			assert.ok(meta);
			assert.deepEqual(meta.resourceName, ['file.doc']);
			assert.deepEqual(meta['Content-Type'], ['application/msword']);
			assert.deepEqual(meta['dcterms:created'], ['2013-12-06T21:15:26Z']);
			done();
		});
	});

	test('extract from extensionless doc', function(done) {
		tika.text('test/data/extensionless/doc', function(err, text) {
			assert.ifError(err);
			assert.equal(text, 'Just some text.\n');
			done();
		});
	});

	test('extract from docx', function(done) {
		tika.text('test/data/file.docx', function(err, text) {
			assert.ifError(err);
			assert.equal(text, 'Just some text.\n');
			done();
		});
	});

	test('extract meta from docx', function(done) {
		tika.meta('test/data/file.docx', function(err, meta) {
			assert.ifError(err);
			assert.ok(meta);
			assert.deepEqual(meta.resourceName, ['file.docx']);
			assert.deepEqual(meta['Content-Type'], ['application/vnd.openxmlformats-officedocument.wordprocessingml.document']);
			assert.deepEqual(meta['Application-Name'], ['LibreOffice/4.1.3.2$MacOSX_x86 LibreOffice_project/70feb7d99726f064edab4605a8ab840c50ec57a']);
			done();
		});
	});

	test('extract from extensionless docx', function(done) {
		tika.text('test/data/extensionless/docx', function(err, text) {
			assert.ifError(err);
			assert.equal(text, 'Just some text.\n');
			done();
		});
	});

	test('extract meta from extensionless docx', function(done) {
		tika.meta('test/data/extensionless/docx', function(err, meta) {
			assert.ifError(err);
			assert.ok(meta);
			assert.deepEqual(meta.resourceName, ['docx']);
			assert.deepEqual(meta['Content-Type'], ['application/vnd.openxmlformats-officedocument.wordprocessingml.document']);
			assert.deepEqual(meta['Application-Name'], ['LibreOffice/4.1.3.2$MacOSX_x86 LibreOffice_project/70feb7d99726f064edab4605a8ab840c50ec57a']);
			done();
		});
	});

	test('extract from pdf', function(done) {
		tika.text('test/data/file.pdf', function(err, text) {
			assert.ifError(err);
			assert.equal(text.trim(), 'Just some text.');
			done();
		});
	});

	test('detect content-type of pdf', function(done) {
		tika.type('test/data/file.pdf', function(err, contentType) {
			assert.ifError(err);
			assert.equal(contentType, 'application/pdf');
			done();
		});
	});

	test('extract meta from pdf', function(done) {
		tika.meta('test/data/file.pdf', function(err, meta) {
			assert.ifError(err);
			assert.ok(meta);
			assert.deepEqual(meta.resourceName, ['file.pdf']);
			assert.deepEqual(meta['Content-Type'], ['application/pdf']);
			assert.deepEqual(meta.producer, ['LibreOffice 4.1']);
			done();
		});
	});

	test('extract from extensionless pdf', function(done) {
		tika.text('test/data/extensionless/pdf', function(err, text) {
			assert.ifError(err);
			assert.equal(text.trim(), 'Just some text.');
			done();
		});
	});

	test('extract meta from extensionless pdf', function(done) {
		tika.meta('test/data/extensionless/pdf', function(err, meta) {
			assert.ifError(err);
			assert.ok(meta);
			assert.deepEqual(meta.resourceName, ['pdf']);
			assert.deepEqual(meta['Content-Type'], ['application/pdf']);
			assert.deepEqual(meta.producer, ['LibreOffice 4.1']);
			done();
		});
	});

	test('extract from protected pdf', function(done) {
		tika.text('test/data/protected/file.pdf', function(err, text) {
			assert.ifError(err);
			assert.equal(text.trim(), 'Just some text.');
			done();
		});
	});

	test('extract meta from protected pdf', function(done) {
		tika.meta('test/data/protected/file.pdf', function(err, meta) {
			assert.ifError(err);
			assert.ok(meta);
			assert.deepEqual(meta.resourceName, ['file.pdf']);
			assert.deepEqual(meta['Content-Type'], ['application/pdf']);
			assert.deepEqual(meta.producer, ['LibreOffice 4.1']);
			done();
		});
	});
});

suite('obscure document tests', function() {
	test('extract from Word 2003 XML', function(done) {
		tika.text('test/data/obscure/word2003.xml', function(err, text) {
			assert.ifError(err);
			assert.ok(-1 !== text.indexOf('Just some text.'));
			assert.ok(-1 === text.indexOf('<?xml'));
			done();
		});
	});
});

suite('structured data tests', function() {
	test('extract from plain XML', function(done) {
		tika.text('test/data/structured/plain.xml', function(err, text) {
			assert.ifError(err);
			assert.ok(-1 !== text.indexOf('Just some text.'));
			assert.ok(-1 === text.indexOf('<?xml'));
			done();
		});
	});
});

suite('image tests', function() {
	test('extract from png', function(done) {
		tika.text('test/data/file.png', function(err, text) {
			assert.ifError(err);
			assert.equal(text, '');
			done();
		});
	});

	test('extract from extensionless png', function(done) {
		tika.text('test/data/extensionless/png', function(err, text) {
			assert.ifError(err);
			assert.equal(text, '');
			done();
		});
	});

	test('extract from gif', function(done) {
		tika.text('test/data/file.gif', function(err, text) {
			assert.ifError(err);
			assert.equal(text, '');
			done();
		});
	});

	test('extract meta from gif', function(done) {
		tika.meta('test/data/file.gif', function(err, meta) {
			assert.ifError(err);
			assert.ok(meta);
			assert.deepEqual(meta.resourceName, ['file.gif']);
			assert.deepEqual(meta['Content-Type'], ['image/gif']);
			assert.deepEqual(meta['Dimension ImageOrientation'], ['Normal']);
			done();
		});
	});

	test('extract from extensionless gif', function(done) {
		tika.text('test/data/extensionless/gif', function(err, text) {
			assert.ifError(err);
			assert.equal(text, '');
			done();
		});
	});

	test('extract meta from extensionless gif', function(done) {
		tika.meta('test/data/extensionless/gif', function(err, meta) {
			assert.ifError(err);
			assert.ok(meta);
			assert.deepEqual(meta.resourceName, ['gif']);
			assert.deepEqual(meta['Content-Type'], ['image/gif']);
			assert.deepEqual(meta['Dimension ImageOrientation'], ['Normal']);
			done();
		});
	});
});

suite('non-utf8 encoded document tests', function() {
	test('extract Windows Latin 1 text', function(done) {
		tika.text('test/data/nonutf8/windows-latin1.txt', function(err, text) {
			assert.ifError(err);
			assert.equal(text, 'Algún pequeño trozo de texto.\n\n');
			done();
		});
	});

	test('detect Windows Latin 1 text charset', function(done) {
		tika.charset('test/data/nonutf8/windows-latin1.txt', function(err, charset) {
			assert.ifError(err);
			assert.equal(typeof charset, 'string');
			assert.equal(charset, 'ISO-8859-1');
			done();
		});
	});

	test('detect Windows Latin 1 text content-type and charset', function(done) {
		tika.typeAndCharset('test/data/nonutf8/windows-latin1.txt', function(err, contentType) {
			assert.ifError(err);
			assert.equal(contentType, 'text/plain; charset=ISO-8859-1');
			done();
		});
	});

	test('extract UTF-16 English-language text', function(done) {
		tika.text('test/data/nonutf8/utf16-english.txt', function(err, text) {
			assert.ifError(err);
			assert.equal(text, 'Just some text.\n\n');
			done();
		});
	});

	test('detect UTF-16 English-language text charset', function(done) {
		tika.charset('test/data/nonutf8/utf16-english.txt', function(err, charset) {
			assert.ifError(err);
			assert.equal(charset, 'UTF-16LE');
			done();
		});
	});

	test('detect UTF-16 English-language text content-type and charset', function(done) {
		tika.typeAndCharset('test/data/nonutf8/utf16-english.txt', function(err, contentType) {
			assert.ifError(err);
			assert.equal(contentType, 'text/plain; charset=UTF-16LE');
			done();
		});
	});

	test('extract UTF-16 Chinese (Simplified) text', function(done) {
		tika.text('test/data/nonutf8/utf16-chinese.txt', function(err, text) {
			assert.ifError(err);
			assert.equal(text, '\u53ea\u662f\u4e00\u4e9b\u6587\u5b57\u3002\n\n');
			done();
		});
	});

	test('detect UTF-16 Chinese (Simplified) text charset', function(done) {
		tika.charset('test/data/nonutf8/utf16-chinese.txt', function(err, charset) {
			assert.ifError(err);
			assert.equal(charset, 'UTF-16LE');
			done();
		});
	});

	test('detect UTF-16 Chinese (Simplified) text content-type and charset', function(done) {
		tika.typeAndCharset('test/data/nonutf8/utf16-chinese.txt', function(err, contentType) {
			assert.ifError(err);
			assert.equal(contentType, 'text/plain; charset=UTF-16LE');
			done();
		});
	});
});

suite('archive tests', function() {
	test('extract from compressed archive', function(done) {
		tika.text('test/data/archive/files.zip', function(err, text) {
			assert.ifError(err);
			assert.equal(text.trim(), 'file1.txt\nSome text 1.\n\n\n\n\nfile2.txt\nSome text 2.\n\n\n\n\nfile3.txt\nSome text 3.');
			done();
		});
	});

	test('detect compressed archive content-type', function(done) {
		tika.type('test/data/archive/files.zip', function(err, contentType) {
			assert.ifError(err);
			assert.equal(contentType, 'application/zip');
			done();
		});
	});

	test('extract from twice compressed archive', function(done) {
		tika.text('test/data/archive/files-files.zip', function(err, text) {
			assert.ifError(err);
			assert.equal(text.trim(), 'file4.txt\nSome text 4.\n\n\n\n\nfile5.txt\nSome text 5.\n\n\n\n\nfile6.txt\nSome text 6.\n\n\n\n\nfiles.zip\n\n\nfile1.txt\n\nSome text 1.\n\n\n\n\n\n\n\nfile2.txt\n\nSome text 2.\n\n\n\n\n\n\n\nfile3.txt\n\nSome text 3.');
			done();
		});
	});
});

suite('encrypted doc tests', function() {
	test('detect encrypted pdf content-type', function(done) {
		tika.type('test/data/encrypted/file.pdf', function(err, contentType) {
			assert.ifError(err);
			assert.equal(contentType, 'application/pdf');
			done();
		});
	});

	test('detect encrypted doc content-type', function(done) {
		tika.type('test/data/encrypted/file.doc', function(err, contentType) {
			assert.ifError(err);
			assert.equal(contentType, 'application/msword');
			done();
		});
	});
});

suite('error handling tests', function() {
	test('extract from encrypted doc', function(done) {
		tika.text('test/data/encrypted/file.doc', function(err, text) {
			assert.ok(err);
			assert.ok(-1 !== err.toString().indexOf('EncryptedDocumentException: Cannot process encrypted word file'));
			done();
		});
	});

	test('extract from encrypted pdf', function(done) {
		tika.text('test/data/encrypted/file.pdf', function(err, text) {
			assert.ok(err);
			assert.ok(-1 !== err.toString().indexOf('TikaException: Unable to extract PDF content'));
			done();
		});
	});
});

suite('http extraction tests', function() {
	test('extract from pdf over http', function(done) {
		tika.text('http://www.ohchr.org/EN/UDHR/Documents/UDHR_Translations/eng.pdf', function(err, text) {
			assert.ifError(err);
			assert.ok(-1 !== text.indexOf('Universal Declaration of Human Rights'));
			done();
		});
	});
});

suite('ftp extraction tests', function() {
	test('extract from text file over ftp', function(done) {
		tika.text('ftp://ftp.ed.ac.uk/INSTRUCTIONS-FOR-USING-THIS-SERVICE', function(err, text) {
			assert.ifError(err);
			assert.ok(-1 !== text.indexOf('This service is managed by Information Services'));
			done();
		});
	});
});

suite('language detection tests', function() {
	test('detect English text', function(done) {
		tika.language('This just some text in English.', function(err, language, reasonablyCertain) {
			assert.ifError(err);
			assert.equal(typeof language, 'string');
			assert.equal(typeof reasonablyCertain, 'boolean');
			assert.equal(language, 'en');
			done();
		});
	});
});
