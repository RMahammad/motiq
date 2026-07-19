// IntersectionObserver mock (jsdom has none) so the composed MotionScene works in tests.
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
  trigger(isIntersecting: boolean) {
    const entries = [...this.elements].map(
      (target) => ({ isIntersecting, target }) as IntersectionObserverEntry,
    );
    this.cb(entries, this);
  }
}

(globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
  MockIntersectionObserver;
