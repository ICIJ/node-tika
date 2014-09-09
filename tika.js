/**
 * @overview
 * @author Matthew Caruana Galizia <m@m.cg>
 * @license MIT
 * @copyright Copyright (c) 2013, Matthew Caruana Galizia
 */

/*jshint node:true, es5: true*/

'use strict';

var java = require('java');

java.classpath.push(__dirname + '/jar/node-tika-1.6.jar');
java.options.push('-Djava.awt.headless=true');
java.options.push('-Xrs');

var NodeTika = java.import('cg.m.nodetika.NodeTika');

function extractMeta(uri, contentType, cb) {
	NodeTika.extractMeta(uri, contentType, function(err, meta) {
		if (err) {
			return cb(err);
		}

		cb(null, JSON.parse(meta));
	});
}

exports.extract = function(uri, contentType, cb) {
	if (arguments.length < 3) {
		cb = contentType;
		contentType = null;
	}

	extractMeta(uri, contentType, function(err, meta) {
		if (err) {
			return cb(err);
		}

		NodeTika.extractText(uri, contentType, function(err, text) {
			cb(err, text, meta);
		});
	});
};

exports.text = function(uri, contentType, cb) {
	if (arguments.length < 3) {
		cb = contentType;
		contentType = null;
	}

	NodeTika.extractText(uri, contentType, cb);
};

exports.meta = function(uri, contentType, cb) {
	if (arguments.length < 3) {
		cb = contentType;
		contentType = null;
	}

	extractMeta(uri, contentType, cb);
};

exports.type = exports.contentType = function(uri, withCharset, cb) {
	if (arguments.length < 3) {
		cb = withCharset;
		withCharset = false;
	}

	NodeTika.detectContentType(uri, withCharset, cb);
};

exports.charset = function(uri, cb) {
	NodeTika.detectCharset(uri, cb);
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
