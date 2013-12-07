# Apache Tika bridge for Node.js #

Depends on [node-java](https://github.com/joeferner/node-java), which itself requires the JDK and Python 2 (not 3) to compile.

Requires JDK 7. Run `node version` to check the version that `node-java` is using. If the wrong version is reported even if you installed JDK 1.7, make sure `JAVA_HOME` is set to the correct path then delete `node_modules/java` and rerun `npm install`.

## Credits and collaboration ##

Developed by [Matthew Caruana Galizia](https://twitter.com/mcaruanagalizia). Requires plenty more development and maintenance. Please feel free to submit an issue or pull request.

## License ##

Copyright (c) 2013 Matthew Caruana Galizia. Licensed under an [MIT-style license](http://mattcg.mit-license.org).

Apache Tika JAR distributed under the [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0).
