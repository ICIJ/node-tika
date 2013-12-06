.DELETE_ON_ERROR:

JAVAS := $(shell ls java/cg/m/nodejs/tika/*.java)

install: jar/Tika.jar

jar/Tika.jar: $(JAVAS) build/java
	javac -d build/java -cp build/tika/tika-core/target/tika-core-1.5-SNAPSHOT.jar:build/tika/tika-core/target/tika-parsers-1.5-SNAPSHOT.jar $(JAVAS)
	cd build/java && jar cvf ../../$@ -C . .

build/java:
	if [ ! -d $@ ]; then \
		mkdir -p $@; \
	fi

.PHONY: install
