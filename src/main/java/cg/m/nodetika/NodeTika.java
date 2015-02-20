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
import java.net.URLConnection;
import java.net.MalformedURLException;

import java.lang.Exception;

import org.apache.tika.io.TikaInputStream;
import org.apache.tika.metadata.Metadata;
import org.apache.tika.metadata.HttpHeaders;
import org.apache.tika.metadata.TikaMetadataKeys;
import org.apache.tika.parser.Parser;
import org.apache.tika.parser.ParseContext;
import org.apache.tika.parser.AutoDetectParser;
import org.apache.tika.parser.PasswordProvider;
import org.apache.tika.parser.html.HtmlParser;
import org.apache.tika.parser.ocr.TesseractOCRConfig;
import org.apache.tika.parser.pdf.PDFParserConfig;
import org.apache.tika.mime.MediaType;
import org.apache.tika.detect.Detector;
import org.apache.tika.detect.AutoDetectReader;
import org.apache.tika.language.LanguageIdentifier;
import org.apache.tika.sax.BodyContentHandler;
import org.apache.tika.sax.ExpandedTitleContentHandler;
import org.apache.tika.config.TikaConfig;
import org.apache.tika.exception.TikaException;
import org.apache.tika.exception.EncryptedDocumentException;

import org.xml.sax.helpers.DefaultHandler;
import org.xml.sax.ContentHandler;
import org.xml.sax.SAXException;

import javax.xml.transform.sax.SAXTransformerFactory;
import javax.xml.transform.sax.TransformerHandler;
import javax.xml.transform.OutputKeys;
import javax.xml.transform.stream.StreamResult;

import com.google.gson.Gson;

public class NodeTika {

	private static final TikaConfig config = TikaConfig.getDefaultConfig();

	private static TikaInputStream createInputStream(String uri) throws FileNotFoundException, MalformedURLException, IOException {
		return createInputStream(uri, null);
	}

	private static TikaInputStream createInputStream(String uri, Metadata metadata) throws FileNotFoundException, MalformedURLException, IOException {
		InputStream inputStream;

		if (uri.startsWith("http://") || uri.startsWith("https://") || uri.startsWith("ftp://")) {
			final URLConnection urlConnection = new URL(uri).openConnection();

			// If a metadata object was passed, fill it with the content-type returned from the server.
			if (metadata != null) {
				fillMetadata(metadata, urlConnection.getContentType());
			}

			inputStream = urlConnection.getInputStream();
		} else {
			inputStream = new FileInputStream(uri);
		}

		return TikaInputStream.get(inputStream);
	}

	private static AutoDetectParser createParser() {
		final AutoDetectParser parser = new AutoDetectParser(config);

		Map<MediaType, Parser> parsers = parser.getParsers();
		parsers.put(MediaType.APPLICATION_XML, new HtmlParser());
		parser.setParsers(parsers);

		parser.setFallback(new Parser() {
			public Set<MediaType> getSupportedTypes(ParseContext parseContext) {
				return parser.getSupportedTypes(parseContext);
			}

			public void parse(InputStream inputStream, ContentHandler contentHandler, Metadata metadata, ParseContext parseContext) throws TikaException {
				throw new TikaException("Unsupported Media Type: " + metadata.get(HttpHeaders.CONTENT_TYPE));
			}
		});

		return parser;
	}

	private static void fillMetadata(AutoDetectParser parser, Metadata metadata, String contentType, String uri) {
		fillMetadata(metadata, contentType, uri);

		final Detector detector = parser.getDetector();

		parser.setDetector(new Detector() {

			public MediaType detect(InputStream inputStream, Metadata metadata) throws IOException {
				String contentType = metadata.get(HttpHeaders.CONTENT_TYPE);

				if (contentType != null) {
					return MediaType.parse(contentType);
				} else {
					return detector.detect(inputStream, metadata);
				}
			}
		});
	}

	private static void fillMetadata(Metadata metadata, String contentType) {
		fillMetadata(metadata, contentType, null);
	}

	private static void fillMetadata(Metadata metadata, String contentType, String uri) {

		// Set the file name.
		if (uri != null) {
			metadata.set(TikaMetadataKeys.RESOURCE_NAME_KEY, new File(uri).getName());
		}

		// Normalise the content-type.
		contentType = normalizeContentType(contentType);

		// Set the content-type.
		if (contentType != null) {
			metadata.add(HttpHeaders.CONTENT_TYPE, contentType);
		}
	}

	private static String normalizeContentType(String contentType) {
		if (contentType == null) {
			return null;
		}

		// URLConnection returns content/unknown as the default content-type.
		if (contentType.equals("content/unknown")) {
			return null;
		}

		if (contentType.equals(MediaType.OCTET_STREAM)) {
			return null;
		}

		if ("xml".equals(MediaType.parse(contentType).getSubtype())) {
			return null;
		}

		return contentType;
	}

	private static void fillParseContext(ParseContext parseContext, Map<String, Object> options) {
		final TesseractOCRConfig ocrConfig = new TesseractOCRConfig();

		if (options == null) {

			// Disable OCR and return if no options are specified.
			disableOcr(ocrConfig);
			parseContext.set(TesseractOCRConfig.class, ocrConfig);

			return;
		}

		fillOcrOptions(ocrConfig, options);
		parseContext.set(TesseractOCRConfig.class, ocrConfig);

		final PDFParserConfig pdfParserConfig = new PDFParserConfig();
		fillPdfOptions(pdfParserConfig, options);
		parseContext.set(PDFParserConfig.class, pdfParserConfig);

		// Allow a password to be specified for encrypted files.
		fillPassword(parseContext, options);
	}

	private static void fillPassword(ParseContext parseContext, Map<String, Object> options) {
		final Object password = options.get("password");

		if (password == null) {
			return;
		}

		parseContext.set(PasswordProvider.class, new PasswordProvider() {

			@Override
			public String getPassword(Metadata metadata) {
				return password.toString();
			}
		});
	}

	private static void fillPdfOptions(PDFParserConfig pdfParserConfig, Map<String, Object> options) {
		final Object averageCharTolerance = options.get("averageCharTolerance");
		final Object enableAutoSpace = options.get("enableAutoSpace");
		final Object extractAcroFormContent = options.get("extractAcroFormContent");
		final Object extractAnnotationText = options.get("extractAnnotationText");
		final Object extractInlineImages = options.get("extractInlineImages");
		final Object extractUniqueInlineImagesOnly = options.get("extractUniqueInlineImagesOnly");
		final Object sortByPosition = options.get("sortByPosition");
		final Object spacingTolerance = options.get("spacingTolerance");
		final Object suppressDuplicateOverlappingText = options.get("suppressDuplicateOverlappingText");
		final Object useNonSequentialParser = options.get("useNonSequentialParser");

		if (averageCharTolerance != null) {
			pdfParserConfig.setAverageCharTolerance(Float.parseFloat(averageCharTolerance.toString()));
		}

		if (enableAutoSpace != null) {
			pdfParserConfig.setEnableAutoSpace((Boolean) enableAutoSpace);
		}

		if (extractAcroFormContent != null) {
			pdfParserConfig.setExtractAcroFormContent((Boolean) extractAcroFormContent);
		}

		if (extractAnnotationText != null) {
			pdfParserConfig.setExtractAnnotationText((Boolean) extractAnnotationText);
		}

		if (extractInlineImages != null) {
			pdfParserConfig.setExtractInlineImages((Boolean) extractInlineImages);
		}

		if (extractUniqueInlineImagesOnly != null) {
			pdfParserConfig.setExtractUniqueInlineImagesOnly((Boolean) extractUniqueInlineImagesOnly);
		}

		if (sortByPosition != null) {
			pdfParserConfig.setSortByPosition((Boolean) sortByPosition);
		}

		if (spacingTolerance != null) {
			pdfParserConfig.setSpacingTolerance(Float.parseFloat(spacingTolerance.toString()));
		}

		if (suppressDuplicateOverlappingText != null) {
			pdfParserConfig.setSuppressDuplicateOverlappingText((Boolean) suppressDuplicateOverlappingText);
		}

		if (useNonSequentialParser != null) {
			pdfParserConfig.setUseNonSequentialParser((Boolean) useNonSequentialParser);
		}
	}

	private static void fillOcrOptions(TesseractOCRConfig ocrConfig, Map<String, Object> options) {

		// Only set the OCR config object on the context if the language is specified.
		// OCR is disabled by default as it can give unexpected results.
		final Object ocrLanguage = options.get("ocrLanguage");
		if (ocrLanguage == null) {
			disableOcr(ocrConfig);

			return;
		}

		ocrConfig.setLanguage(ocrLanguage.toString());

		final Object ocrPath = options.get("ocrPath");
		final Object ocrMaxFileSize = options.get("ocrMaxFileSize");
		final Object ocrMinFileSize = options.get("ocrMinFileSize");
		final Object ocrPageSegmentationMode = options.get("ocrPageSegmentationMode");
		final Object ocrTimeout = options.get("ocrTimeout");

		if (ocrPath != null) {
			ocrConfig.setTesseractPath(ocrPath.toString());
		}

		if (ocrMaxFileSize != null) {
			ocrConfig.setMaxFileSizeToOcr(Integer.parseInt(ocrMaxFileSize.toString()));
		}

		if (ocrMinFileSize != null) {
			ocrConfig.setMinFileSizeToOcr(Integer.parseInt(ocrMinFileSize.toString()));
		}

		if (ocrPageSegmentationMode != null) {
			ocrConfig.setPageSegMode(ocrPageSegmentationMode.toString());
		}

		if (ocrTimeout != null) {
			ocrConfig.setTimeout(Integer.parseInt(ocrTimeout.toString()));
		}
	}

	private static void disableOcr(TesseractOCRConfig ocrConfig) {

		// This is necessary until Tika introduces a way to blacklist parsers.
		// See https://issues.apache.org/jira/browse/TIKA-1557
		if (System.getProperty("os.name").startsWith("Windows")) {
			ocrConfig.setTesseractPath("\\Device\\Null\\");
		} else {
			ocrConfig.setTesseractPath("/dev/null/");
		}
	}

	public static String extractText(String uri, String optionsJson) throws Exception {
		Map<String, Object> options = null;

		if (optionsJson != null) {
			options = new Gson().fromJson(optionsJson, HashMap.class);
		}

		return extractText(uri, options);
	}

	public static String extractText(String uri, Map<String, Object> options) throws Exception {
		final AutoDetectParser parser = createParser();
		final Metadata metadata = new Metadata();
		final ParseContext context = new ParseContext();

		String outputEncoding = null;
		String contentType = null;

		if (options != null) {
			Object option;

			option = options.get("outputEncoding");
			if (option != null) {
				outputEncoding = option.toString();
			}

			option = options.get("contentType");
			if (option != null) {
				contentType = option.toString();
			}
		}

		if (outputEncoding == null) {
			outputEncoding = "UTF-8";
		}

		fillMetadata(parser, metadata, contentType, uri);
		fillParseContext(context, options);

		final ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
		final OutputStreamWriter writer = new OutputStreamWriter(outputStream, outputEncoding);
		final BodyContentHandler body = new BodyContentHandler(new RichTextContentHandler(writer));

		final TikaInputStream inputStream = createInputStream(uri, metadata);

		// Set up recursive parsing of archives.
		// See: http://wiki.apache.org/tika/RecursiveMetadata
		context.set(Parser.class, parser);

		try {
			parser.parse(inputStream, body, metadata, context);
		} catch (SAXException e) {
			throw e;
		} catch (EncryptedDocumentException e) {
			throw e;
		} catch (TikaException e) {
			throw e;
		} finally {
			inputStream.close();
		}

		return outputStream.toString(outputEncoding);
	}

	public static String extractXml(String uri, String outputFormat, String optionsJson) throws Exception {
		Map<String, Object> options = null;

		if (optionsJson != null) {
			options = new Gson().fromJson(optionsJson, HashMap.class);
		}

		return extractXml(uri, outputFormat, options);
	}

	public static String extractXml(String uri, String outputFormat, Map<String, Object> options) throws Exception {
		final AutoDetectParser parser = createParser();
		final Metadata metadata = new Metadata();
		final ParseContext context = new ParseContext();

		String outputEncoding = null;
		String contentType = null;

		if (options != null) {
			Object option;

			option = options.get("outputEncoding");
			if (option != null) {
				outputEncoding = option.toString();
			}

			option = options.get("contentType");
			if (option != null) {
				contentType = option.toString();
			}
		}

		if (outputEncoding == null) {
			outputEncoding = "UTF-8";
		}

		fillMetadata(parser, metadata, contentType, uri);
		fillParseContext(context, options);

		final ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
		final OutputStreamWriter writer = new OutputStreamWriter(outputStream, outputEncoding);
		ContentHandler content;

		SAXTransformerFactory factory = (SAXTransformerFactory)SAXTransformerFactory.newInstance();
		TransformerHandler handler = factory.newTransformerHandler();
		handler.getTransformer().setOutputProperty(OutputKeys.METHOD, outputFormat);
		handler.getTransformer().setOutputProperty(OutputKeys.INDENT, "no");
		handler.getTransformer().setOutputProperty(OutputKeys.ENCODING, outputEncoding);
		handler.setResult(new StreamResult(writer));
		content = new ExpandedTitleContentHandler(handler);

		final TikaInputStream inputStream = createInputStream(uri, metadata);

		// Set up recursive parsing of archives.
		// See: http://wiki.apache.org/tika/RecursiveMetadata
		context.set(Parser.class, parser);

		try {
			parser.parse(inputStream, content, metadata, context);
		} catch (SAXException e) {
			throw e;
		} catch (EncryptedDocumentException e) {
			throw e;
		} catch (TikaException e) {
			throw e;
		} finally {
			inputStream.close();
		}

		return outputStream.toString(outputEncoding);
	}

	public static String extractMeta(String uri) throws Exception {
		return extractMeta(uri, null);
	}

	public static String extractMeta(String uri, String contentType) throws Exception {
		final AutoDetectParser parser = createParser();
		final Metadata metadata = new Metadata();

		fillMetadata(parser, metadata, contentType, uri);

		final TikaInputStream inputStream = createInputStream(uri, metadata);

		parser.parse(inputStream, new DefaultHandler(), metadata);

		Map meta = new HashMap();
		for (String name : metadata.names()) {
			String[] values = metadata.getValues(name);
			meta.put(name, values);
		}

		inputStream.close();

		return new Gson().toJson(meta);
	}

	public static String detectCharset(String uri) throws FileNotFoundException, IOException, TikaException {
		return detectCharset(uri, null);
	}

	public static String detectCharset(String uri, String contentType) throws FileNotFoundException, IOException, TikaException {
		final Metadata metadata = new Metadata();

		// Use metadata to provide type-hinting to the AutoDetectReader.
		fillMetadata(metadata, contentType, uri);

		final TikaInputStream inputStream = createInputStream(uri, metadata);

		// Detect the character set.
		final AutoDetectReader reader = new AutoDetectReader(inputStream, metadata);
		String charset = reader.getCharset().toString();

		inputStream.close();

		return charset;
	}

	public static String detectContentType(String uri) throws FileNotFoundException, IOException, TikaException {
		final Detector detector = config.getDetector();
		final TikaInputStream inputStream = createInputStream(uri);
		final Metadata metadata = new Metadata();

		// Set the file name. This provides some level of type-hinting.
		metadata.add(TikaMetadataKeys.RESOURCE_NAME_KEY, new File(uri).getName());

		// Detect the content type.
		String contentType = detector.detect(inputStream, metadata).toString();

		inputStream.close();

		// Return the default content-type if undetermined.
		if (contentType == null || contentType.isEmpty()) {
			return MediaType.OCTET_STREAM.toString();
		}

		return contentType;
	}

	public static String detectContentTypeAndCharset(String uri) throws FileNotFoundException, IOException, TikaException {
		final Detector detector = config.getDetector();
		final TikaInputStream inputStream = createInputStream(uri);
		final Metadata metadata = new Metadata();

		// Set the file name. This provides some level of type-hinting.
		metadata.add(TikaMetadataKeys.RESOURCE_NAME_KEY, new File(uri).getName());

		// Detect the content type.
		String contentType = detector.detect(inputStream, metadata).toString();

		// Use metadata to provide type-hinting to the AutoDetectReader.
		fillMetadata(metadata, contentType, uri);

		// Detect the character set.
		final AutoDetectReader reader = new AutoDetectReader(inputStream, metadata);
		String charset = reader.getCharset().toString();

		inputStream.close();

		// Return the default content-type if undetermined.
		if (contentType == null || contentType.isEmpty()) {
			return MediaType.OCTET_STREAM.toString();
		}

		// Append the charset if the content-type was determined.
		if (charset != null && !charset.isEmpty()) {
			return contentType + "; charset=" + charset;
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
