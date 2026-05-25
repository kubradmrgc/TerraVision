/** Multicast handler list used by web/mobile realtime services. */
export function createHandlerRegistry<TEvent>() {
  type Handler = (event: TEvent) => void;
  let handlers: Handler[] = [];

  return {
    add(handler: Handler): () => void {
      handlers.push(handler);
      return () => {
        handlers = handlers.filter((h) => h !== handler);
      };
    },
    emit(event: TEvent): void {
      handlers.forEach((handler) => handler(event));
    }
  };
}
