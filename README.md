# node-tika #

Provides text extraction, metadata extraction, mime-type detection, text-encoding detection and language detection. All via a native Java bridge with the Apache Tika content-analysis toolkit. Bundles [Tika 1.7](http://tika.apache.org/1.7/index.html).

[![Build Status](https://travis-ci.org/mattcg/node-tika.png?branch=master)](https://travis-ci.org/mattcg/node-tika) [![npm version](https://badge.fury.io/js/tika.png)](https://badge.fury.io/js/tika)

Depends on [node-java](https://github.com/joeferner/node-java), which itself requires the JDK and Python 2 (not 3) to compile.

Requires JDK 7. Run `node version` to check the version that `node-java` is using. If the wrong version is reported even if you installed JDK 1.7, make sure `JAVA_HOME` is set to the correct path then delete `node_modules/java` and rerun `npm install`.

## Extracting text ##

```javascript
var tika = require('tika');

var options = {

	// Hint the content-type. This is optional but would help Tika choose a parser in some cases.
	contentType: 'application/pdf'
};

tika.text('test/data/file.pdf', options, function(err, text) {
	console.log(text);
});
```

We can even extract directly from the Web. If the server returns a content-type header, it will be passed to Tika as a hint.

```javascript
tika.text('http://www.ohchr.org/EN/UDHR/Documents/UDHR_Translations/eng.pdf', function(err, text, meta) {
	// ...
});
```

Or extract text using OCR (requires [Tesseract](https://wiki.apache.org/tika/TikaOCR)).

```javascript
tika.text('test/data/ocr/simple.jpg', {
	ocrLanguage: 'eng'
}, function(err, text) {
	// ...
});
```

## API ##

All methods that accept a `uri` parameter accept relative or absolute file paths and `http:`, `https:` or `ftp:` URLs.

The available options are the following.

 - `contentType` to provide a hint to Tika on which parser to use.
 - `outputEncoding` to specify the text output encoding. Defaults to UTF-8.
 - `password` to set a password to be used for encrypted files.

### OCR options ###

 - `ocrLanguage` to set the language used by Tesseract. This option is required to enable OCR.
 - `ocrPath` to set the path to the Tesseract binaries.
 - `ocrMaxFileSize` to set maximum file size in bytes to submit to OCR.
 - `ocrMinFileSize` to set minimum file size in bytes to submit to OCR.
 - `ocrPageSegmentationMode` to set the Tesseract page segmentation mode.
 - `ocrTimeout` to set the maximum time in seconds to wait for the Tesseract process to terminate.

### PDF parser options ###

 - `pdfAverageCharTolerance` see [`PDFTextStripper.setAverageCharTolerance(float)`](http://pdfbox.apache.org/docs/1.8.8/javadocs/org/apache/pdfbox/util/PDFTextStripper.html#setAverageCharTolerance%28float%29).
 - `pdfEnableAutoSpace` to set whether the parser should estimate where spaces should be inserted between words (`true` by default).
 - `pdfExtractAcroFormContent` to set whether content should be extracted from AcroForms at the end of the document (`true` by default).
 - `pdfExtractAnnotationText` to set whether to extract text from annotations (`true` by default).
 - `pdfExtractInlineImages` to set whether to extract inline embedded OBX images.
 - `pdfExtractUniqueInlineImagesOnly` as multiple pages within a PDF file might refer to the same underlying image.
 - `pdfSortByPosition` to set whether to sort text tokens by their x/y position before extracting text.
 - `pdfSpacingTolerance` see [`PDFTextStripper.setSpacingTolerance(float)`](http://pdfbox.apache.org/docs/1.8.8/javadocs/org/apache/pdfbox/util/PDFTextStripper.html#setSpacingTolerance%28float%29).
 - `pdfSuppressDuplicateOverlappingText` to set whether the parse should try to remove duplicated text over the same region.
 - `pdfUseNonSequentialParser` to set whether to use PDFBox's non-sequential parser.

### tika.extract(uri, [options,] cb) ###

Extract both text and metadata from a file.

```javascript
tika.extract('test/data/file.pdf', function(err, text, meta) {
	console.log(text); // Logs 'Just some text'.
	console.log(meta.producer[0]); // Logs 'LibreOffice 4.1'.
});
```

### tika.text(uri, [options,] cb) ###

Extract text from a file.

```javascript
tika.text('test/data/file.pdf', function(err, text) {
	console.log(text);
});
```

### tika.xhtml(uri, [options,] cb) ###

Get an XHTML representation of the text extracted from a file.

```javascript
tika.xhtml('test/data/file.pdf', function(err, xhtml) {
	console.log(xhtml);
});
```

### tika.meta(uri, [options,] cb) ###

Extract metadata from a file. Returns an object with names as keys and arrays as values.

```javascript
tika.meta('test/data/file.pdf', function(err, meta) {
	console.log(meta.producer[0]); // Logs 'LibreOffice 4.1'.
});
```

### tika.type(uri, cb) ###

Detect the content-type (MIME type) of a file.

```javascript
tika.type('test/data/file.pdf', function(err, contentType) {
	console.log(contentType); // Logs 'application/pdf'.
});
```

### tika.charset(uri, [options,] cb) ###

Detect the character set (text encoding) of a file.

```javascript
tika.charset('test/data/file.txt', function(err, charset) {
	console.log(charset); // Logs 'ISO-8859-1'.
});
```

### tika.typeAndCharset(uri, cb) ###

Detect the content-type and character set of a file.

The character set will be appended to the mime-type if available.

```javascript
tika.typeAndCharset('test/data/file.txt', function(err, typeAndCharset) {
	console.log(typeAndCharset); // Logs 'text/plain; charset=ISO-8859-1'.
});
```

### tika.language(string, cb) ###

Detect the language a given string is written in.

```javascript
tika.language('This is just some text in English.', function(err, language, reasonablyCertain) {
	console.log(language); // Logs 'en'.
	console.log(reasonablyCertain); // Logs true or false.
});
```

## Credits and collaboration ##

Developed by [Matthew Caruana Galizia](https://twitter.com/mcaruanagalizia). Please feel free to submit an issue or pull request.

## License ##

Copyright (c) 2013 Matthew Caruana Galizia. Licensed under an [MIT-style license](http://mattcg.mit-license.org).

Apache Tika JAR distributed under the [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0).
