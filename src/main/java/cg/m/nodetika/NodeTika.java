/*
 * Copyright (c) 2013, Matthew Caruana Galizia. Licensed under an MIT-style license.
 * You may obtain a copy of the License at
 *
 *		 http://mattcg.mit-license.org
 */

package cg.m.nodetika;

import java.util.Map;
import java.util.HashMap;
import java.util.Set;

import java.io.IOException;
import java.io.FileNotFoundException;
import java.io.File;
import java.io.InputStream;
import java.io.FileInputStream;
import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;

import java.net.URL;
import java.net.MalformedURLException;

import java.lang.Exception;

import org.apache.tika.io.TikaInputStream;
import org.apache.tika.metadata.Metadata;
import org.apache.tika.metadata.HttpHeaders;
import org.apache.tika.metadata.TikaMetadataKeys;
import org.apache.tika.parser.Parser;
import org.apache.tika.parser.ParseContext;
import org.apache.tika.parser.AutoDetectParser;
import org.apache.tika.parser.html.HtmlParser;
import org.apache.tika.mime.MediaType;
import org.apache.tika.detect.Detector;
import org.apache.tika.detect.AutoDetectReader;
import org.apache.tika.language.LanguageIdentifier;
import org.apache.tika.sax.BodyContentHandler;
import org.apache.tika.config.TikaConfig;
import org.apache.tika.exception.TikaException;
import org.apache.tika.exception.EncryptedDocumentException;

import org.xml.sax.helpers.DefaultHandler;
import org.xml.sax.ContentHandler;
import org.xml.sax.SAXException;

import com.google.gson.Gson;

public class NodeTika {

	private static TikaInputStream createInputStream(String uri) throws FileNotFoundException, MalformedURLException, IOException {
		InputStream inputStream;

		if (uri.startsWith("http://") || uri.startsWith("https://")) {
			inputStream = new URL(uri).openStream();
		} else {
			inputStream = new FileInputStream(uri);
		}

		return TikaInputStream.get(inputStream);
	}

	private static AutoDetectParser createParser() {
		final AutoDetectParser parser = new AutoDetectParser();

		Map<MediaType, Parser> parsers = parser.getParsers();
		parsers.put(MediaType.APPLICATION_XML, new HtmlParser());
		parser.setParsers(parsers);

		parser.setFallback(new Parser() {
			public Set<MediaType> getSupportedTypes(ParseContext parseContext) {
				return parser.getSupportedTypes(parseContext);
			}

			public void parse(InputStream inputStream, ContentHandler contentHandler, Metadata metadata, ParseContext parseContext) throws TikaException {
				throw new TikaException("Unsupported Media Type");
			}
		});

		return parser;
	}

	private static Metadata createMetadata(AutoDetectParser parser, String contentType, String uri) {
		Metadata metadata = new Metadata();
		metadata.set(TikaMetadataKeys.RESOURCE_NAME_KEY, new File(uri).getName());

		if (contentType != null && "xml".equals(MediaType.parse(contentType).getSubtype())) {
			contentType = null;
		}

		if (contentType != null && contentType.equals(MediaType.OCTET_STREAM)) {
			contentType = null;
		}

		if (contentType != null) {
			metadata.add(HttpHeaders.CONTENT_TYPE, contentType);

			final Detector detector = parser.getDetector();

			parser.setDetector(new Detector() {
				public MediaType detect(InputStream inputStream, Metadata metadata) throws IOException {
					String ct = metadata.get(HttpHeaders.CONTENT_TYPE);

					if (ct != null) {
						return MediaType.parse(ct);
					} else {
						return detector.detect(inputStream, metadata);
					}
				}
			});
		}

		return metadata;
	}

	public static String extractText(String uri, String contentType) throws Exception {
		return extractText(uri, contentType, "UTF8");
	}

	public static String extractText(String uri, String contentType, String outputEncoding) throws Exception {
		AutoDetectParser parser = createParser();
		Metadata metadata = createMetadata(parser, contentType, uri);
		TikaInputStream inputStream = createInputStream(uri);

		ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
		OutputStreamWriter writer = new OutputStreamWriter(outputStream, outputEncoding);
		BodyContentHandler body = new BodyContentHandler(new RichTextContentHandler(writer));

		try {
			parser.parse(inputStream, body, metadata);
		} catch (SAXException e) {
			throw e;
		} catch (EncryptedDocumentException e) {
			throw e;
		} catch (TikaException e) {
			throw e;
		} finally {
			inputStream.close();
		}

		return outputStream.toString("UTF-8");
	}

	public static String extractMeta(String uri, String contentType) throws Exception {
		AutoDetectParser parser = createParser();
		Metadata metadata = createMetadata(parser, contentType, uri);
		TikaInputStream inputStream = createInputStream(uri);

		parser.parse(inputStream, new DefaultHandler(), metadata);

		Map meta = new HashMap();
		for (String name : metadata.names()) {
			String[] values = metadata.getValues(name);
			meta.put(name, values[0]);
		}

		inputStream.close();
		return new Gson().toJson(meta);
	}

	public static String detectCharset(String uri) throws FileNotFoundException, IOException, TikaException {
		TikaInputStream inputStream = createInputStream(uri);
		AutoDetectReader reader = new AutoDetectReader(inputStream);
		String charset = reader.getCharset().toString();

		inputStream.close();
		return charset;
	}

	public static String detectContentType(String uri, boolean withCharset) throws TikaException, FileNotFoundException, IOException {
		Detector detector = new TikaConfig().getDetector();
		TikaInputStream inputStream = createInputStream(uri);
		Metadata metadata = new Metadata();

		metadata.add(TikaMetadataKeys.RESOURCE_NAME_KEY, uri);
		String contentType = detector.detect(inputStream, metadata).toString();

		inputStream.close();

		if (withCharset == true && contentType != null && !contentType.isEmpty()) {
			String charset = detectCharset(uri);
			if (charset != null && !charset.isEmpty()) {
				return contentType + "; charset=" + charset;
			}
		}

		return contentType;
	}

	public static String detectLanguage(String text) {
		LanguageIdentifier identifier = new LanguageIdentifier(text);
		Map language = new HashMap();

		language.put("language", identifier.getLanguage());
		language.put("reasonablyCertain", identifier.isReasonablyCertain());

		return new Gson().toJson(language);
	}
}
