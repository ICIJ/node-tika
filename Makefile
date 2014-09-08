.DELETE_ON_ERROR:

JAVAS := $(shell ls src/main/java/cg/m/nodetika/*.java)
JAR := jar/node-tika-1.6.jar
PARSERS_JAR := build/tika/tika-core/target/tika-parsers-1.6.jar

install: node_modules

update: build/tika-1.6 $(JAR)

$(JAR): $(JAVAS) build/tika-1.6
	mvn install

$(PARSERS_JAR): build/tika-1.6
	 cd $< && mvn clean && mvn install -Dmaven.test.skip=true
	 touch $<

build/tika-1.6-src.zip: build
	if [ ! -f $@ ]; then \
		curl http://www.eu.apache.org/dist/tika/tika-1.6-src.zip --output build/tika-1.6-src.zip; \
	else \
		touch $@; \
	fi

build/tika-1.6: build/tika-1.6-src.zip
	if [ ! -d $@ ]; then \
		unzip build/tika-1.6-src.zip -d build; \
	else \
		touch $@; \
	fi

node_modules: package.json
	npm install
	touch $@

build:
	if [ ! -d $@ ]; then \
		mkdir $@; \
	fi

test: node_modules
	./node_modules/.bin/istanbul cover ./node_modules/.bin/_mocha -- --timeout 30000 --reporter spec --check-leaks --ui tdd --recursive

clean:
	rm -rf coverage build node_modules

.PHONY: install update test clean
