package cg.m.nodejs.tika;

import org.apache.tika.detect.Detector;

import java.io.IOException;
import java.io.InputStream;

import org.apache.tika.metadata.Metadata;
import org.apache.tika.metadata.HttpHeaders;
import org.apache.tika.mime.MediaType;

public class DetectorHelper implements Detector {

	private final String contentType;
	private final Detector detector;
	private final Metadata metadata;

	public DetectorHelper(String contentType, Detector detector, Metadata metadata) {
		this.detector = detector;
		this.metadata = metadata;
		this.contentType = contentType;
	}

	public MediaType detect(InputStream inputStream, Metadata metadata) throws IOException {
		String ct = metadata.get(HttpHeaders.CONTENT_TYPE);

		if (ct != null) {
			return MediaType.parse(ct);
		} else {
			return detector.detect(inputStream, metadata);
		}
	}
}
