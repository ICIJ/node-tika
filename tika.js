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

function detectCharset(tikaInputStream, cb) {
	async.waterfall([
		function(cb) {
			java.newInstance('org.apache.tika.detect.AutoDetectReader', tikaInputStream, function(err, reader) {
				cb(err, reader);
			});
		},

		function(reader, cb) {
			reader.getCharset(function(err, charset) {
				cb(err, charset);
			});
		},

		function(charset, cb) {
			charset.toString(function(err, charset) {
				cb(err, charset);
			});
		}
	], cb);
}

exports.text = function(filePath, contentType, cb) {
	if (arguments.length < 3) {
		cb = contentType;
		contentType = null;
	}

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
		if (tikaInputStream) {
			tikaInputStream.close();
		}

		if (err) {
			return cb(err);
		}

		outputStream.toString('UTF-8', cb);
	});
};

exports.meta = function(filePath, contentType, cb) {
	if (arguments.length < 3) {
		cb = contentType;
		contentType = null;
	}

	async.waterfall([
		createParser,

		function(parser, cb) {
			java.newInstance('org.apache.tika.metadata.Metadata', function(err, metadata) {
				cb(err, parser, metadata);
			});
		},

		function(parser, metadata, cb) {
			fillMetadata(parser, metadata, contentType, path.basename(filePath), function(err) {
				cb(err, parser, metadata);
			});
		},

		function(parser, metadata, cb) {
			java.newInstance('java.io.FileInputStream', filePath, function(err, fileInputStream) {
				cb(err, parser, metadata, fileInputStream);
			});
		},

		function(parser, metadata, fileInputStream, cb) {
			java.newInstance('org.xml.sax.helpers.DefaultHandler', function(err, defaultHandler) {
				cb(err, parser, metadata, fileInputStream, defaultHandler);
			});
		},

		function(parser, metadata, fileInputStream, defaultHandler, cb) {
			parser.parse(fileInputStream, defaultHandler, metadata, function(err) {
				metadata.names(function(err, names) {
					cb(err, metadata, names);
				});
			});
		},

		function(metadata, names, cb) {
			var queue, list = {};

			if (!names.length) {
				return cb();
			}

			queue = async.queue(function(name, cb) {
				metadata.getValues(name, function(err, values) {
					list[name] = values;
					cb(err);
				});
			}, 1);

			queue.drain = function() {
				cb(null, list);
			};

			queue.push(names, function(err) {
				if (err) {

					// Bail if there's an error - fail fast rather than silently.
					queue.drain = null;
					queue.tasks.length = 0;
					cb(err);
				}
			});
		}
	], cb);
};

exports.contentType = function(filePath, withCharset, cb) {
	var waterfall;

	if (arguments.length < 3) {
		cb = withCharset;
		withCharset = false;
	}

	waterfall = [
		function(cb) {
			java.newInstance('org.apache.tika.config.TikaConfig', cb);
		},

		function(config, cb) {
			config.getDetector(cb);
		},

		function(detector, cb) {
			java.newInstance('java.io.FileInputStream', filePath, function(err, fileInputStream) {
				cb(err, detector, fileInputStream);
			});
		},

		function(detector, fileInputStream, cb) {
			TikaInputStream.get(fileInputStream, function(err, tikaInputStream) {
				cb(err, detector, tikaInputStream);
			});
		},

		function(detector, tikaInputStream, cb) {
			java.newInstance('org.apache.tika.metadata.Metadata', function(err, metadata) {
				cb(err, detector, tikaInputStream, metadata);
			});
		},

		function(detector, tikaInputStream, metadata, cb) {
			metadata.add(TikaMetadataKeys.RESOURCE_NAME_KEY, filePath, function(err) {
				cb(err, detector, tikaInputStream, metadata);
			});
		},

		function(detector, tikaInputStream, metadata, cb) {
			detector.detect(tikaInputStream, metadata, function(err, mediaType) {
				cb(err, tikaInputStream, mediaType);
			});
		},

		function(tikaInputStream, mediaType, cb) {
			mediaType.toString(function(err, contentType) {
				cb(err, tikaInputStream, contentType);
			});
		}
	];

	if (withCharset) {
		waterfall.push(function(tikaInputStream, contentType, cb) {
			detectCharset(tikaInputStream, function(err, charset) {
				cb(err, tikaInputStream, contentType, charset);
			});
		});
	}

	async.waterfall(waterfall, function(err, tikaInputStream, contentType, charset) {
		if (tikaInputStream) {
			tikaInputStream.close();
		}

		if (contentType && charset) {
			contentType = contentType + '; charset=' + charset;
		}

		return cb(err, contentType);
	});
};
