var java = require('java');

java.classpath.push('commons-lang3-3.1.jar');
java.classpath.push('commons-io.jar');

var System = java.import('java.lang.System');

console.log('Java version: ' + System.getPropertySync('java.version'));
console.log('Java home: ' + System.getPropertySync('java.home'));
