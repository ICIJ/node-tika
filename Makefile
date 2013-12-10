.DELETE_ON_ERROR:

JAVAS := $(shell ls java/cg/m/nodejs/tika/*.java)
CORE_JAR := build/tika/tika-core/target/tika-core-1.5-SNAPSHOT.jar
PARSERS_JAR := build/tika/tika-core/target/tika-parsers-1.5-SNAPSHOT.jar
SERVER_JAR := build/tika/tika-server/target/tika-server-1.5-SNAPSHOT.jar

install: node_modules

update: update-tika jar/vendor/tika-server-1.5-SNAPSHOT.jar jar/Tika.jar

jar/Tika.jar: $(CORE_JAR) $(PARSERS_JAR) $(JAVAS) build/java
	javac -d build/java -cp $(CORE_JAR):$(PARSERS_JAR) $(JAVAS)
	cd build/java && jar cvf ../../$@ -C . .

jar/vendor/tika-server-1.5-SNAPSHOT.jar: $(SERVER_JAR)
	cp $< $@

$(SERVER_JAR) $(CORE_JAR) $(PARSERS_JAR): build/tika
	 cd build/tika && mvn clean && mvn install

update-tika build/tika:
	if [ ! -d build/tika ]; then \
		git clone git://git.apache.org/tika.git build/tika; \
	else \
		cd build/tika && git pull; \
		touch .; \
	fi

build/java:
	if [ ! -d $@ ]; then \
		mkdir -p $@; \
	fi

node_modules: package.json
	npm install
	touch $@

test: node_modules
	./node_modules/.bin/mocha --timeout 30000 --reporter spec --check-leaks --ui tdd --recursive

.PHONY: install update update-tika test
