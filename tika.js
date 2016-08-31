/**
 * @overview
 * @author Matthew Caruana Galizia <mcaruana@icij.org>
 * @license MIT
 * @copyright Copyright (c) 2013 The Center for Public Integrity®
 */

/*jshint node:true*/

'use strict';

var java = require('java');
var fs = require('fs');
var q = require('q');

java.classpath.push(__dirname + '/jar/node-tika-1.13.jar');
java.options.push('-Djava.awt.headless=true');
java.options.push('-Xrs');

var NodeTika = java.import('org.icij.nodetika.NodeTika');


var isBuffer = function(uri){
    return true
}

var onBufferArgument = function(buffer, cb){
    var deferred = q.defer()
    var uri = './tmp'
    var tmp = fs.createWriteStream(uri)
    tmp.on('open', function(fd){
        tmp.write(buffer);
        tmp.close()
    })
    tmp.on('close', function(fd){
        deferred.resolve(uri)
    });
    return deferred.promise;
}

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

    if(!isBuffer(uri)){
	    NodeTika.extractText(uri, JSON.stringify(options), cb);
    }else{
        onBufferArgument(uri).then(function(uri){
            NodeTika.extractText(uri, JSON.stringify(options), function(){
                cb.apply(null, arguments)
                fs.unlink(uri)
            });
        })
    }
};

exports.xhtml = function(uri, options, cb) {
	if (arguments.length < 3) {
		cb = options;
		options = null;
	}

    if(!isBuffer(uri)){
	    NodeTika.extractXml(uri, 'html', JSON.stringify(options), cb);
    }else{
        onBufferArgument(uri).then(function(uri){
            NodeTika.extractXml(uri, 'html', JSON.stringify(options), cb);
        });
    }
};

exports.meta = function(uri, options, cb) {
	var handler = function(err, meta) {
		if (err) {
			return cb(err);
		}

		cb(null, JSON.parse(meta));
        fs.unlink(uri)
	};

	if (arguments.length < 3) {
		cb = options;
		options = null;
	}

	if (options) {
        if(!isBuffer(uri)){
            NodeTika.extractMeta(uri, options.contentType, handler);
        }else{
            onBufferArgument(uri).then(function(uri){
                NodeTika.extractMeta(uri, options.contentType, handler);
            });
        }
    } else {
        if(!isBuffer(uri)){
            NodeTika.extractMeta(uri, handler);
        }else{
            onBufferArgument(uri).then(function(uri){
                NodeTika.extractMeta(uri, handler);
            });
        }
	}
};

exports.type = exports.contentType = function(uri, cb) {
    if(!isBuffer(uri)){
        NodeTika.detectContentType(uri, cb);
    }else{
        onBufferArgument(uri).then(function(uri){
            NodeTika.detectContentType(uri, function(){
                cb.apply(null, arguments)
                fs.unlink(uri)
            });
        });
    }
};

exports.charset = function(uri, options, cb) {
	if (arguments.length < 3) {
		cb = options;
		options = null;
	}

	if (options) {
        if(!isBuffer(uri)){
            NodeTika.detectCharset(uri, options.contentType, cb);
        }else{
            onBufferArgument(uri).then(function(uri){
                NodeTika.detectCharset(uri, options.contentType, function(){
                    cb.apply(null, arguments)
                    fs.unlink(uri)
                });
            });
        }
	} else {
        if(!isBuffer(uri)){
            NodeTika.detectCharset(uri, cb);
        }else{
            onBufferArgument(uri).then(function(uri){
                NodeTika.detectCharset(uri, function(){
                    cb.apply(null, arguments)
                    fs.unlink(uri)
                });
            });
        }
	}
};

exports.typeAndCharset = function(uri, cb) {
    if(!isBuffer(uri)){
        NodeTika.detectContentTypeAndCharset(uri, cb);
    }else{
        onBufferArgument(uri).then(function(uri){
            NodeTika.detectContentTypeAndCharset(uri, function(){
                cb.apply(null, arguments)
                fs.unlink(uri)
            });
        });
    }
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
