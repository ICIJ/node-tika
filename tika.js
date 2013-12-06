/*jshint node:true, es5: true*/

'use strict';

var java = require('java');
var path = require('path');
var async = require('async');

java.classpath.push('jar/Tika.jar');

// TODO: Instead of using tika-server JAR, copy tika-server's pom.xml here and use maven to install deps and create Tika.jar.
java.classpath.push('jar/vendor/tika-server-1.5-SNAPSHOT.jar');

java.options.push('-Djava.awt.headless=true');

var TikaInputStream = java.import('org.apache.tika.io.TikaInputStream');
var MediaType = java.import('org.apache.tika.mime.MediaType');
var TikaMetadataKeys = java.import('org.apache.tika.metadata.TikaMetadataKeys');
var HttpHeaders = java.import('org.apache.tika.metadata.HttpHeaders');

var ShutdownHookHelper = java.import('cg.m.nodejs.tika.ShutdownHookHelper');
var DetectorHelper = java.import('cg.m.nodejs.tika.DetectorHelper');
var WriteOutHelper = java.import('cg.m.nodejs.tika.WriteOutHelper');

ShutdownHookHelper.setShutdownHookSync(java.newProxy('java.lang.Runnable', {
	run: function() {}
}));

function createParser(cb) {
	async.waterfall([
		function(cb) {
			java.newInstance('org.apache.tika.parser.AutoDetectParser', cb);
		},

		function(parser, cb) {
			parser.getParsers(function(err, parsers) {
				cb(err, parser, parsers);
			});
		},

		function(parser, parsers, cb) {
			java.newInstance('org.apache.tika.parser.html.HtmlParser', function(err, htmlParser) {
				cb(err, parser, parsers, htmlParser);
			});
		},

		function(parser, parsers, htmlParser, cb) {
			parsers.put(MediaType.APPLICATION_XML, htmlParser, function(err) {
				cb(err, parser, parsers);
			});
		},

		function(parser, parsers) {
			parser.setParsers(parsers, function(err) {
				cb(err, parser);
			});
		}
	], cb);
}

function fillMetadata(parser, metadata, contentType, fileName, cb) {
	async.waterfall([
		function(cb) {
			metadata.set(TikaMetadataKeys.RESOURCE_NAME_KEY, fileName, function(err) {
				cb(err, parser, metadata);
			});
		},

		function(parser, metadata, cb) {
		    if (contentType && '/xml' === contentType.slice(contentType.indexOf('/'))) {
				contentType = null;
		    }

			if ('application/octet-stream' === contentType) {
				contentType = null;
			}

			if (contentType) {
				metadata.add(HttpHeaders.CONTENT_TYPE, contentType, function(err) {
					cb(err, parser, metadata);
				});
			} else {
				cb(null, parser, metadata);
			}
		},

		function(parser, metadata, cb) {
			if (!contentType) {
				return cb(null, parser, metadata, null);
			}

			parser.getDetector(function(err, detector) {
				cb(err, parser, metadata, detector);
			});
		},

		function(parser, metadata, detector, cb) {
			if (!detector) {
				return cb(null, parser, null);
			}

			java.newInstance('cg.m.nodejs.tika.DetectorHelper', contentType, detector, metadata, function(err, detectorHelper) {
				cb(err, parser, detectorHelper);
			});
		},

		function(parser, detectorHelper, cb) {
			if (!detectorHelper) {
				return cb();
			}

			parser.setDetector(detectorHelper, cb);
		}
	], cb);
}

exports.getText = function(filePath, contentType, cb) {
	async.waterfall([
		createParser,

		function(parser, cb) {
			java.newInstance('java.io.ByteArrayOutputStream', function(err, outputStream) {
				cb(err, parser, outputStream);
			});
		},

		function(parser, outputStream, cb) {
			java.newInstance('java.io.OutputStreamWriter', outputStream, function(err, writer) {
				cb(err, parser, outputStream, writer);
			});
		},

		function(parser, outputStream, writer, cb) {
			java.newInstance('cg.m.nodejs.tika.WriteOutHelper', writer, function(err, writerHelper) {
				cb(err, parser, outputStream, writerHelper);
			});
		},

		function(parser, outputStream, writerHelper, cb) {
			java.newInstance('org.apache.tika.sax.BodyContentHandler', writerHelper, function(err, body) {
				cb(err, parser, outputStream, body);
			});
		},

		function(parser, outputStream, body, cb) {
			java.newInstance('java.io.FileInputStream', filePath, function(err, fileInputStream) {
				cb(err, parser, outputStream, body, fileInputStream);
			});
		},

		function(parser, outputStream, body, fileInputStream, cb) {
			TikaInputStream.get(fileInputStream, function(err, tikaInputStream) {
				cb(err, parser, outputStream, body, tikaInputStream);
			});
		},

		function(parser, outputStream, body, tikaInputStream, cb) {
			java.newInstance('org.apache.tika.metadata.Metadata', function(err, metadata) {
				if (err) {
					return cb(err);
				}

				fillMetadata(parser, metadata, contentType, path.basename(filePath), function(err) {
					cb(err, parser, outputStream, body, tikaInputStream, metadata);
				});
			});
		},

		function(parser, outputStream, body, tikaInputStream, metadata, cb) {
			tikaInputStream.getFile(function(err) {
				cb(err, parser, outputStream, body, tikaInputStream, metadata);
			});
		},

		function(parser, outputStream, body, tikaInputStream, metadata, cb) {
			parser.parse(tikaInputStream, body, metadata, function(err) {
				cb(err, outputStream, tikaInputStream);
			});
		}
	], function(err, outputStream, tikaInputStream) {
		tikaInputStream.close();

		if (err) {
			return cb(err);
		}

		outputStream.toString('UTF-8', cb);
	});
};
