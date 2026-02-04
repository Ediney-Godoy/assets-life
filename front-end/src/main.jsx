import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { SidebarProvider } from './contexts/SidebarContext';
import './i18n';
import './index.css';
import { BrowserRouter } from 'react-router-dom';

const rootEl = document.getElementById('root');
if (rootEl) {
  try {
    ReactDOM.createRoot(rootEl).render(
      <React.StrictMode>
        <BrowserRouter>
          <SidebarProvider>
            <App />
          </SidebarProvider>
        </BrowserRouter>
      </React.StrictMode>
    );
  } catch (err) {
    console.error('[bootstrap] erro ao iniciar a aplicação:', err);
    try {
      rootEl.innerHTML = '<div style="padding:16px;font-family:Inter,system-ui,sans-serif;color:#111827"><h2 style="margin:0 0 8px;">Falha ao iniciar a aplicação</h2><p>Tente atualizar a página (Ctrl+Shift+R). Se persistir, abra em janela anônima e verifique se há extensões do navegador interferindo.</p></div>';
    } catch {}
  }
}
