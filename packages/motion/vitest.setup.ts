// Controllable IntersectionObserver mock (jsdom has none). Tests reach the latest
// instance via (globalThis.IntersectionObserver as MockIO).instances and call .trigger().
type IOCallback = (entries: IntersectionObserverEntry[], observer: unknown) => void;

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  private readonly cb: IOCallback;
  readonly elements = new Set<Element>();
  constructor(cb: IOCallback) {
    this.cb = cb;
    MockIntersectionObserver.instances.push(this);
  }
  observe(el: Element) {
    this.elements.add(el);
  }
  unobserve(el: Element) {
    this.elements.delete(el);
  }
  disconnect() {
    this.elements.clear();
  }
  /** test helper: simulate intersection change for all observed elements */
  trigger(isIntersecting: boolean) {
    const entries = [...this.elements].map(
      (target) => ({ isIntersecting, target }) as IntersectionObserverEntry,
    );
    this.cb(entries, this);
  }
}

(globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
  MockIntersectionObserver;
