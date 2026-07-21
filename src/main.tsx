// Safe fetch patching for environments (like sandboxed preview iframes) where window.fetch has only a getter
(function() {
  try {
    const targetWindow = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null);
    if (!targetWindow) return;

    const originalFetch = targetWindow.fetch ? targetWindow.fetch.bind(targetWindow) : undefined;
    let currentFetch = originalFetch;

    const applyFetchPatch = (obj: any) => {
      if (!obj) return;
      try {
        const desc = Object.getOwnPropertyDescriptor(obj, 'fetch');
        if (desc && desc.configurable === false) {
          return;
        }
        Object.defineProperty(obj, 'fetch', {
          get() {
            return currentFetch;
          },
          set(value) {
            currentFetch = value;
          },
          configurable: true,
          enumerable: true
        });
      } catch (err) {
        // Ignore descriptor definition errors in restricted contexts
      }
    };

    if (typeof Window !== 'undefined' && Window.prototype) {
      applyFetchPatch(Window.prototype);
    }
    if (typeof window !== 'undefined') {
      applyFetchPatch(window);
    }
    if (typeof globalThis !== 'undefined') {
      applyFetchPatch(globalThis);
    }
  } catch (e) {
    console.warn('Failed to apply fetch shim:', e);
  }
})();

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
