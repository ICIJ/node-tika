package cg.m.nodetika;

import org.apache.tika.sax.WriteOutContentHandler;
import org.xml.sax.Attributes;
import org.xml.sax.SAXException;

import java.io.OutputStreamWriter;

class WriteOutHelper extends WriteOutContentHandler {
	public WriteOutHelper(OutputStreamWriter writer) {
		super(writer);
	}

	@Override
	public void startElement(String uri, String localName, String qName, Attributes attributes) throws SAXException {
		super.startElement(uri, localName, qName, attributes);

		if ("img".equals(localName) && attributes.getValue("alt") != null) {
			String nfo = "[image: " + attributes.getValue("alt") + ']';

			characters(nfo.toCharArray(), 0, nfo.length());
		}

		if ("a".equals(localName) && attributes.getValue("name") != null) {
			String nfo = "[bookmark: " + attributes.getValue("name") + ']';

			characters(nfo.toCharArray(), 0, nfo.length());
		}
	}
}
