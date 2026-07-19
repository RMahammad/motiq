// jsdom lacks these APIs that Motion + Radix touch. Minimal, deterministic mocks.

class MockObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
(globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = MockObserver;
(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = MockObserver;

if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {
      return false;
    },
  })) as typeof window.matchMedia;
}

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function () {};
}
if (!(HTMLElement.prototype as unknown as { hasPointerCapture?: unknown }).hasPointerCapture) {
  (HTMLElement.prototype as unknown as { hasPointerCapture: () => boolean }).hasPointerCapture = () => false;
  (HTMLElement.prototype as unknown as { setPointerCapture: () => void }).setPointerCapture = () => {};
  (HTMLElement.prototype as unknown as { releasePointerCapture: () => void }).releasePointerCapture = () => {};
}
