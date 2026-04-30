import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AppProvider } from './context/AppContext.tsx'

// Global Error Logger for debugging white screen
window.addEventListener('error', (event) => {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="padding: 20px; color: white; background: #900; font-family: monospace;">
        <h2>🚨 Runtime Error:</h2>
        <pre>${event.message}</pre>
        <p>At line: ${event.lineno}:${event.colno}</p>
        <p>File: ${event.filename}</p>
        <button onclick="location.reload()" style="padding: 10px; margin-top: 10px; cursor: pointer;">Retry</button>
      </div>
    `;
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
)
