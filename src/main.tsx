// Safe fetch patching for environments (like sandboxed preview iframes) where window.fetch has only a getter
(function() {
  try {
    const patchTarget = (obj: any) => {
      if (!obj) return;
      
      const tryDefine = (target: any) => {
        try {
          const desc = Object.getOwnPropertyDescriptor(target, 'fetch');
          if (desc && desc.configurable === false) {
            return false;
          }
          
          const originalFetch = target.fetch;
          let customFetch = originalFetch;

          Object.defineProperty(target, 'fetch', {
            get() {
              return customFetch;
            },
            set(value) {
              customFetch = value;
            },
            configurable: true,
            enumerable: true
          });
          return true;
        } catch (err) {
          return false;
        }
      };

      // Try to define on the object itself first
      const success = tryDefine(obj);
      if (!success) {
        // If it fails (e.g. read-only on instance/prototype restrictions), try the prototype chain
        const proto = Object.getPrototypeOf(obj);
        if (proto) {
          tryDefine(proto);
        }
      }
    };

    if (typeof window !== 'undefined') {
      patchTarget(window);
    }
    if (typeof globalThis !== 'undefined' && (typeof window === 'undefined' || globalThis !== window)) {
      patchTarget(globalThis);
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
