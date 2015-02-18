/**
 * @overview
 * @author Matthew Caruana Galizia <m@m.cg>
 * @license MIT
 * @copyright Copyright (c) 2013, Matthew Caruana Galizia
 */

/*jshint node:true, es5: true*/

'use strict';

var java = require('java');

java.classpath.push(__dirname + '/jar/node-tika-1.7.jar');
java.options.push('-Djava.awt.headless=true');
java.options.push('-Xrs');

var NodeTika = java.import('cg.m.nodetika.NodeTika');

exports.extract = function(uri, options, cb) {
	if (arguments.length < 3) {
		cb = options;
		options = null;
	}

	exports.text(uri, options, function(err, text) {
		if (err) {
			return cb(err);
		}

		exports.meta(uri, options, function(err, meta) {
			cb(err, text, meta);
		});
	});
};

exports.text = function(uri, options, cb) {
	if (arguments.length < 3) {
		cb = options;
		options = null;
	}

	if (options) {
		NodeTika.extractText(uri, options.contentType, cb);
	} else {
		NodeTika.extractText(uri, cb);
	}
};

exports.xhtml = function(uri, options, cb) {
	if (arguments.length < 3) {
		cb = options;
		options = null;
	}

	if (options) {
		NodeTika.extractXml(uri, 'html', options.contentType, cb);
	} else {
		NodeTika.extractXml(uri, 'html', cb);
	}
};

exports.meta = function(uri, options, cb) {
	var handler = function(err, meta) {
		if (err) {
			return cb(err);
		}

		cb(null, JSON.parse(meta));
	};

	if (arguments.length < 3) {
		cb = options;
		options = null;
	}

	if (options) {
		NodeTika.extractMeta(uri, options.contentType, handler);
	} else {
		NodeTika.extractMeta(uri, handler);
	}
};

exports.type = exports.contentType = function(uri, cb) {
	NodeTika.detectContentType(uri, cb);
};

exports.charset = function(uri, options, cb) {
	if (arguments.length < 3) {
		cb = options;
		options = null;
	}

	if (options) {
		NodeTika.detectCharset(uri, options.contentType, cb);
	} else {
		NodeTika.detectCharset(uri, cb);
	}
};

exports.typeAndCharset = function(uri, cb) {
	NodeTika.detectContentTypeAndCharset(uri, cb);
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
