package cg.m.nodetika;

public class ShutdownHookHelper {
	public static void setShutdownHook(final Runnable r) {
		Runtime.getRuntime().addShutdownHook(new Thread() {
			@Override
			public void run() {
				r.run();
			}
		});
	}
}
