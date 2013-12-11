/*jshint node:true, es5: true*/

'use strict';

var java = require('java');
var path = require('path');
var async = require('async');

java.classpath.push(__dirname + '/jar/node-tika-1.5-SNAPSHOT.jar');
java.options.push('-Djava.awt.headless=true');
java.options.push('-Xrs');

var TikaInputStream = java.import('org.apache.tika.io.TikaInputStream');
var MediaType = java.import('org.apache.tika.mime.MediaType');
var TikaMetadataKeys = java.import('org.apache.tika.metadata.TikaMetadataKeys');
var HttpHeaders = java.import('org.apache.tika.metadata.HttpHeaders');

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

function createInputStream(filePath, cb) {
	async.waterfall([
		function(cb) {
			java.newInstance('java.io.FileInputStream', filePath, function(err, fileInputStream) {
				cb(err, fileInputStream);
			});
		},

		function(fileInputStream, cb) {
			TikaInputStream.get(fileInputStream, function(err, tikaInputStream) {
				cb(err, tikaInputStream);
			});
		}
	], cb);
}

function fillMetadata(parser, contentType, filePath, cb) {
	async.waterfall([
		function(cb) {
			java.newInstance('org.apache.tika.metadata.Metadata', function(err, metadata) {
				cb(err, metadata);
			});
		},

		function(metadata, cb) {
			metadata.set(TikaMetadataKeys.RESOURCE_NAME_KEY, path.basename(filePath), function(err) {
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
				return cb(null, parser, metadata, null);
			}

			java.newInstance('cg.m.nodetika.DetectorHelper', contentType, detector, metadata, function(err, detectorHelper) {
				cb(err, parser, metadata, detectorHelper);
			});
		},

		function(parser, metadata, detectorHelper, cb) {
			if (!detectorHelper) {
				return cb(null, metadata);
			}

			parser.setDetector(detectorHelper, function(err) {
				cb(err, metadata);
			});
		}
	], cb);
}

function extractText(parser, metadata, inputStream, cb) {
	async.waterfall([
		function(cb) {
			java.newInstance('java.io.ByteArrayOutputStream', function(err, outputStream) {
				cb(err, outputStream);
			});
		},

		function(outputStream, cb) {
			java.newInstance('java.io.OutputStreamWriter', outputStream, function(err, writer) {
				cb(err, outputStream, writer);
			});
		},

		function(outputStream, writer, cb) {
			java.newInstance('cg.m.nodetika.WriteOutHelper', writer, function(err, writerHelper) {
				cb(err, outputStream, writerHelper);
			});
		},

		function(outputStream, writerHelper, cb) {
			java.newInstance('org.apache.tika.sax.BodyContentHandler', writerHelper, function(err, body) {
				cb(err, parser, outputStream, body);
			});
		},

		function(parser, outputStream, body, cb) {
			inputStream.getFile(function(err) {
				cb(err, parser, outputStream, body);
			});
		},

		function(parser, outputStream, body, cb) {
			parser.parse(inputStream, body, metadata, function(err) {
				cb(err, outputStream);
			});
		}
	], function(err, outputStream) {
		if (err) {
			return cb(err);
		}

		outputStream.toString('UTF-8', cb);
	});
}

function extractMeta(parser, metadata, inputStream, cb) {
	async.waterfall([
		function(cb) {
			java.newInstance('org.xml.sax.helpers.DefaultHandler', function(err, defaultHandler) {
				cb(err, parser, metadata, inputStream, defaultHandler);
			});
		},

		function(parser, metadata, inputStream, defaultHandler, cb) {
			parser.parse(inputStream, defaultHandler, metadata, function(err) {
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
}

function detectCharset(inputStream, cb) {
	async.waterfall([
		function(cb) {
			java.newInstance('org.apache.tika.detect.AutoDetectReader', inputStream, function(err, reader) {
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

function extract(filePath, contentType, withText, withMeta, cb) {
	async.waterfall([
		createParser,

		function(parser, cb) {
			fillMetadata(parser, contentType, filePath, function(err, metadata) {
				cb(err, parser, metadata);
			});
		},

		function(parser, metadata, cb) {
			createInputStream(filePath, function(err, inputStream) {
				cb(err, parser, metadata, inputStream);
			});
		},

		function(parser, metadata, inputStream, cb) {
			if (withMeta && withText) {
				inputStream.mark(0, function(err) {
					cb(err, parser, metadata, inputStream);
				});
			} else {
				cb(null, parser, metadata, inputStream);
			}
		},

		function(parser, metadata, inputStream, cb) {
			if (withMeta) {
				extractMeta(parser, metadata, inputStream, function(err, list) {
					cb(err, parser, metadata, inputStream, list);
				});
			} else {
				cb(null, parser, metadata, inputStream, null);
			}
		},

		function(parser, metadata, inputStream, list, cb) {
			if (withMeta && withText) {
				inputStream.reset(function(err) {
					cb(err, parser, metadata, inputStream, list);
				});
			} else {
				cb(null, parser, metadata, inputStream, list);
			}
		},

		function(parser, metadata, inputStream, list, cb) {
			if (withText) {
				extractText(parser, metadata, inputStream, function(err, text) {
					cb(err, parser, metadata, inputStream, list, text);
				});
			} else {
				cb(null, parser, metadata, inputStream, list, null);
			}
		}
	], function(err, parser, metadata, inputStream, list, text) {
		var key;

		if (inputStream) {
			inputStream.close();
		}

		if (list) {
			for (key in list) {
				list[key] = list[key][0];
			}
		}

		cb(err, text, list);
	});
}

exports.extract = function(filePath, contentType, cb) {
	if (arguments.length < 3) {
		cb = contentType;
		contentType = null;
	}

	extract(filePath, contentType, true, true, cb);
};

exports.text = function(filePath, contentType, cb) {
	if (arguments.length < 3) {
		cb = contentType;
		contentType = null;
	}

	extract(filePath, contentType, true, false, function(err, text) {
		cb(err, text);
	});
};

exports.meta = function(filePath, contentType, cb) {
	if (arguments.length < 3) {
		cb = contentType;
		contentType = null;
	}

	extract(filePath, contentType, false, true, function(err, text, list) {
		cb(err, list);
	});
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
			createInputStream(filePath, function(err, inputStream) {
				cb(err, detector, inputStream);
			});
		},

		function(detector, inputStream, cb) {
			java.newInstance('org.apache.tika.metadata.Metadata', function(err, metadata) {
				cb(err, detector, inputStream, metadata);
			});
		},

		function(detector, inputStream, metadata, cb) {
			metadata.add(TikaMetadataKeys.RESOURCE_NAME_KEY, filePath, function(err) {
				cb(err, detector, inputStream, metadata);
			});
		},

		function(detector, inputStream, metadata, cb) {
			detector.detect(inputStream, metadata, function(err, mediaType) {
				cb(err, detector, inputStream, mediaType);
			});
		},

		function(detector, inputStream, mediaType, cb) {
			mediaType.toString(function(err, contentType) {
				cb(err, detector, inputStream, contentType);
			});
		}
	];

	if (withCharset) {
		waterfall.push(function(detector, inputStream, contentType, cb) {
			detectCharset(inputStream, function(err, charset) {
				cb(err, detector, inputStream, contentType, charset);
			});
		});
	}

	async.waterfall(waterfall, function(err, detector, inputStream, contentType, charset) {
		if (inputStream) {
			inputStream.close();
		}

		if (contentType && charset) {
			contentType = contentType + '; charset=' + charset;
		}

		return cb(err, contentType);
	});
};

exports.charset = function(filePath, cb) {
	async.waterfall([
		function(cb) {
			createInputStream(filePath, function(err, inputStream) {
				cb(err, inputStream);
			});
		},

		function(inputStream, cb) {
			detectCharset(inputStream, function(err, charset) {
				cb(err, inputStream, charset);
			});
		}
	], function(err, inputStream, charset) {
		if (inputStream) {
			inputStream.close();
		}

		cb(err, charset);
	});
};

exports.language = function(string, cb) {
	async.waterfall([
		function(cb) {
			java.newInstance('org.apache.tika.language.LanguageIdentifier', java.newInstanceSync('java.lang.String', string), cb);
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
