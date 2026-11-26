import "@testing-library/jest-dom";

// configurable: true is required so vi.stubGlobal("matchMedia", ...) can redefine it per-test
Object.defineProperty(window, "matchMedia", {
  writable: true,
  configurable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// jsdom does not implement crypto.randomUUID — polyfill it so cookieConsent and
// any other module that calls crypto.randomUUID() works in tests
if (!crypto.randomUUID) {
  Object.defineProperty(crypto, "randomUUID", {
    writable: true,
    configurable: true,
    value: () => {
      // RFC 4122 v4 UUID
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
      }) as `${string}-${string}-${string}-${string}-${string}`;
    },
  });
}
