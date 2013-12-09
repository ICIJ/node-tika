.DELETE_ON_ERROR:

JAVAS := $(shell ls java/cg/m/nodejs/tika/*.java)

install: node_modules

update: jar/vendor/tika-server-1.5-SNAPSHOT.jar jar/Tika.jar 

jar/Tika.jar: $(JAVAS) build/java
	javac -d build/java -cp build/tika/tika-core/target/tika-core-1.5-SNAPSHOT.jar:build/tika/tika-core/target/tika-parsers-1.5-SNAPSHOT.jar $(JAVAS)
	cd build/java && jar cvf ../../$@ -C . .

jar/vendor/tika-server-1.5-SNAPSHOT.jar: build/tika
	cp build/tika/tika-server/target/tika-server-1.5-SNAPSHOT.jar $@

build/tika:
	cd build/tika && git pull && mvn clean && mvn install

build/java:
	if [ ! -d $@ ]; then \
		mkdir -p $@; \
	fi

node_modules: package.json
	npm install
	touch $@

test: node_modules
	./node_modules/.bin/mocha --timeout 30000 --reporter spec --check-leaks --ui tdd --recursive

.PHONY: install update test
