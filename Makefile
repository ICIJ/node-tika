.DELETE_ON_ERROR:

TIKA_VERSION := 1.12
JAVAS := $(shell ls src/main/java/cg/m/nodetika/*.java)
JAR := jar/node-tika-$(TIKA_VERSION).jar
PARSERS_JAR := build/tika/tika-core/target/tika-parsers-$(TIKA_VERSION).jar

install: node_modules

update: build/tika-$(TIKA_VERSION) $(JAR)

$(JAR): $(JAVAS) build/tika-$(TIKA_VERSION)
	mvn install

$(PARSERS_JAR): build/tika-$(TIKA_VERSION)
	 cd $< && mvn clean && mvn install -Dmaven.test.skip=true
	 touch $<

build/tika-$(TIKA_VERSION)-src.zip: build
	if [ ! -f $@ ]; then \
		curl http://www.eu.apache.org/dist/tika/tika-$(TIKA_VERSION)-src.zip --output build/tika-$(TIKA_VERSION)-src.zip; \
	else \
		touch $@; \
	fi

build/tika-$(TIKA_VERSION): build/tika-$(TIKA_VERSION)-src.zip
	if [ ! -d $@ ]; then \
		unzip build/tika-$(TIKA_VERSION)-src.zip -d build; \
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
	rm -rf build

.PHONY: install update test clean
