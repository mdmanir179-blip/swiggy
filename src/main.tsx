// Ensure window.fetch is safely configurable before any imports evaluate
try {
  if (typeof window !== 'undefined') {
    let currentFetch = window.fetch ? window.fetch.bind(window) : undefined;
    Object.defineProperty(window, 'fetch', {
      get() {
        return currentFetch;
      },
      set(val) {
        currentFetch = val;
      },
      configurable: true,
      enumerable: true,
    });
  }
} catch {
  // safe fallback
}

import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);
