# Apache Tika bridge for Node.js #

Depends on [node-java](https://github.com/joeferner/node-java), which itself requires the JDK and Python 2 (not 3) to compile.

Requires JDK 7. Run `node version` to check the version that `node-java` is using. If the wrong version is reported even if you installed JDK 1.7, make sure `JAVA_HOME` is set to the correct path then delete `node_modules/java` and rerun `npm install`.

## API ##

```javascript
var tika = require('tika');
```

### tika.text(filePath, [contentType,] cb) ###

Extract text from a file. Content type is optional but would help Tika in some cases.

```javascript
tika.text('test/data/file.pdf', function(err, text) {
	assert.equal(text.trim(), 'Just some text.');
});
```

### tika.meta(filePath, [contentType,] cb) ###

Extract metadata from a file. Returns an object with values as arrays.

```javascript
tika.meta('test/data/file.pdf', function(err, meta) {
	assert.deepEqual(meta.producer, ['LibreOffice 4.1']);
});
```

### tika.contentType(filePath, [withCharset,] cb) ###

Detect the content-type of a file.

```javascript
tika.contentType('test/data/file.pdf', function(err, contentType) {
	assert.equal(contentType, 'application/pdf');
});
```

The `withCharset` parameter defaults to `false`. If set to `true`, then the charset will be appended to the mime-type.

```javascript
tika.contentType('test/data/file.txt', true, function(err, contentType) {
	assert.equal(contentType, 'text/plain; charset=ISO-8859-1');
});
```

### tika.charset(filePath, cb) ###

Detect the character set (text encoding) of a file.

```javascript
tika.contentType('test/data/file.txt', true, function(err, charset) {
	assert.equal(charset, 'ISO-8859-1');
});
```

## Credits and collaboration ##

Developed by [Matthew Caruana Galizia](https://twitter.com/mcaruanagalizia). Requires plenty more development and maintenance. Please feel free to submit an issue or pull request.

## License ##

Copyright (c) 2013 Matthew Caruana Galizia. Licensed under an [MIT-style license](http://mattcg.mit-license.org).

Apache Tika JAR distributed under the [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0).
