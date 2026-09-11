let lastCapturedError: unknown = undefined;

if (typeof globalThis !== "undefined") {
  const handler = (event: ErrorEvent | PromiseRejectionEvent) => {
    lastCapturedError =
      "reason" in event ? event.reason : (event as ErrorEvent).error;
  };
  globalThis.addEventListener?.("error", handler as EventListener);
  globalThis.addEventListener?.("unhandledrejection", handler as EventListener);
}

export function consumeLastCapturedError(): unknown {
  const err = lastCapturedError;
  lastCapturedError = undefined;
  return err;
}
