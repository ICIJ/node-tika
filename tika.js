/*jshint node:true, es5: true*/

'use strict';

var java = require('java');

java.classpath.push(__dirname + '/jar/node-tika-1.5.jar');
java.options.push('-Djava.awt.headless=true');
java.options.push('-Xrs');

var NodeTika = java.import('cg.m.nodetika.NodeTika');

function extractMeta(filePath, contentType, cb) {
	NodeTika.extractMeta(filePath, contentType, function(err, meta) {
		if (err) {
			cb(err);
			return;
		}

		cb(null, JSON.parse(meta));
	});
}

exports.extract = function(filePath, contentType, cb) {
	if (arguments.length < 3) {
		cb = contentType;
		contentType = null;
	}

	extractMeta(filePath, contentType, function(err, meta) {
		if (err) {
			cb(err);
			return;
		}

		NodeTika.extractText(filePath, contentType, function(err, text) {
			cb(err, text, meta);
		});
	});
};

exports.text = function(filePath, contentType, cb) {
	if (arguments.length < 3) {
		cb = contentType;
		contentType = null;
	}

	NodeTika.extractText(filePath, contentType, cb);
};

exports.meta = function(filePath, contentType, cb) {
	if (arguments.length < 3) {
		cb = contentType;
		contentType = null;
	}

	extractMeta(filePath, contentType, cb);
};

exports.contentType = function(filePath, withCharset, cb) {
	if (arguments.length < 3) {
		cb = withCharset;
		withCharset = false;
	}

	NodeTika.detectContentType(filePath, withCharset, cb);
};

exports.charset = function(filePath, cb) {
	NodeTika.detectCharset(filePath, cb);
};

exports.language = function(text, cb) {
	NodeTika.detectLanguage(text, function(err, language) {
		if (err) {
			cb(err);
		} else {
			language = JSON.parse(language);
			cb(null, language.language, language.reasonablyCertain);
		}
	});
};
