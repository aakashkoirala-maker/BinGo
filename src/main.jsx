import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import ErrorBoundary from './components/common/ErrorBoundary.jsx'
import App from './App.jsx'

console.log('=== MAIN.JSX LOADING ===');

// Global error handler
window.addEventListener('error', (e) => {
  console.error('Global error caught:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
});

const rootElement = document.getElementById('root');
console.log('Root element:', rootElement);

if (rootElement) {
  console.log('Creating React root...');
  try {
    createRoot(rootElement).render(
      <StrictMode>
        <ErrorBoundary>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ErrorBoundary>
      </StrictMode>,
    );
    console.log('React app mounted successfully');
  } catch (error) {
    console.error('Error mounting React app:', error);
    rootElement.innerHTML = `
      <div style="padding: 20px; background: #fee; color: #c33; font-family: sans-serif;">
        <h2>Fatal Error</h2>
        <p>Failed to mount React application:</p>
        <pre>${error.message}</pre>
      </div>
    `;
  }
} else {
  console.error('FATAL: Root element not found!');
  document.body.innerHTML = `
    <div style="padding: 20px; background: #fee; color: #c33; font-family: sans-serif;">
      <h2>Critical Error</h2>
      <p>Root element (#root) not found in DOM</p>
    </div>
  `;
}