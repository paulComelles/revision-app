import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import 'katex/dist/katex.min.css';
import './index.css';
import { App } from './App';
import { ensureSeeded } from './db/repo';
import './features/review/renderers';

registerSW({ immediate: true });

ensureSeeded().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </StrictMode>,
  );
});
