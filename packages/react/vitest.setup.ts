// IntersectionObserver mock (jsdom has none) so components composing Reveal/InView work.
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

// ---- jsdom polyfills required by Radix Dialog (focus-scope + react-remove-scroll) ----
const g = globalThis as unknown as {
  ResizeObserver?: unknown;
  matchMedia?: unknown;
};
g.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
if (!(window as unknown as { matchMedia?: unknown }).matchMedia) {
  (window as unknown as { matchMedia: (q: string) => unknown }).matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent: () => false,
  });
}
const proto = Element.prototype as unknown as Record<string, unknown>;
proto["hasPointerCapture"] ??= () => false;
proto["setPointerCapture"] ??= () => {};
proto["releasePointerCapture"] ??= () => {};
proto["scrollIntoView"] ??= () => {};
