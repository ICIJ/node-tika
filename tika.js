/*jshint node:true, es5: true*/

'use strict';

var java = require('java');
var path = require('path');

java.classpath.push('jar/Tika.jar');

// TODO: Make everything async. Use async method calls (with callback) and async constructors instead of java.import.
// TODO: Instead of using tika-server JAR, copy tika-server's pom.xml here and use maven to install deps and create Tika.jar.

java.classpath.push('jar/vendor/tika-server-1.5-SNAPSHOT.jar');

java.options.push('-Djava.awt.headless=true');

var ByteArrayOutputStream = java.import('java.io.ByteArrayOutputStream');
var FileInputStream = java.import('java.io.FileInputStream');
var OutputStreamWriter = java.import('java.io.OutputStreamWriter');

var SAXException = java.import('org.xml.sax.SAXException');

var TikaInputStream = java.import('org.apache.tika.io.TikaInputStream');
var AutoDetectParser = java.import('org.apache.tika.parser.AutoDetectParser');
var HtmlParser = java.import('org.apache.tika.parser.html.HtmlParser');
var MediaType = java.import('org.apache.tika.mime.MediaType');
var EncryptedDocumentException = java.import('org.apache.tika.exception.EncryptedDocumentException');
var TikaException = java.import('org.apache.tika.exception.TikaException');
var BodyContentHandler = java.import('org.apache.tika.sax.BodyContentHandler');
var Metadata = java.import('org.apache.tika.metadata.Metadata');
var TikaMetadataKeys = java.import('org.apache.tika.metadata.TikaMetadataKeys');
var HttpHeaders = java.import('org.apache.tika.metadata.HttpHeaders');

var ShutdownHookHelper = java.import('cg.m.nodejs.tika.ShutdownHookHelper');
var DetectorHelper = java.import('cg.m.nodejs.tika.DetectorHelper');
var WriteOutHelper = java.import('cg.m.nodejs.tika.WriteOutHelper');

ShutdownHookHelper.setShutdownHookSync(java.newProxy('java.lang.Runnable', {
	run: function() {}
}));

function createParser() {
	var parser, parsers;

	parser = new AutoDetectParser();

	parsers = parser.getParsers();
	parsers.put(MediaType.APPLICATION_XML, new HtmlParser());
	parser.setParsers(parsers);

	return parser;
}

function fillMetadata(parser, metadata, contentType, fileName) {
	var detector;

	metadata.set(TikaMetadataKeys.RESOURCE_NAME_KEY, fileName);

    if (contentType && '/xml' === contentType.slice(contentType.indexOf('/'))) {
		contentType = null;
    }

	if ('application/octet-stream' === contentType) {
		contentType = null;
	}

	if (contentType) {
		metadata.add(HttpHeaders.CONTENT_TYPE, contentType);

		detector = parser.getDetector();
		parser.setDetector(new DetectorHelper(contentType, detector, metadata));
	}
}

exports.getText = function(filePath, contentType) {
	var parser, fileInputStream, tikaInputStream, outputStream, writer, body, fileName, metadata;

	outputStream = new ByteArrayOutputStream();
    writer = new OutputStreamWriter(outputStream, 'UTF-8');
	body = new BodyContentHandler(new WriteOutHelper(writer));

	parser = createParser();

	fileInputStream = new FileInputStream(filePath);
	tikaInputStream = TikaInputStream.get(fileInputStream);

	metadata = new Metadata();
	fileName = path.basename(filePath);
	fillMetadata(parser, metadata, contentType, fileName);

	try {
		tikaInputStream.getFile();
		parser.parse(tikaInputStream, body, metadata);
	} catch (err) {
		if (err instanceof SAXException) {
			throw new Error('SAX error.');
		} else if (err instanceof EncryptedDocumentException) {
			throw new Error('Document is encrypted.');
		} else if (err instanceof TikaException) {
			throw new Error('Text extraction failed.');
		} else {
			throw new Error('Unknown error.');
		}
	} finally {
		tikaInputStream.close();
	}

	return outputStream.toString('UTF-8');
};
