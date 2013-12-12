/*jshint node:true, es5: true*/

'use strict';

var java = require('java');
var path = require('path');
var async = require('async');

java.classpath.push(__dirname + '/jar/node-tika-1.5-SNAPSHOT.jar');
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

exports.language = function(string, cb) {
	async.waterfall([
		function(cb) {
			java.newInstance('org.apache.tika.language.LanguageIdentifier', string, cb);
		},

		function(identifier, cb) {
			identifier.getLanguage(function(err, language) {
				cb(err, identifier, language);
			});
		},

		function(identifier, language, cb) {
			identifier.isReasonablyCertain(function(err, reasonablyCertain) {
				cb(err, language, reasonablyCertain);
			});
		}
	], cb);
};
