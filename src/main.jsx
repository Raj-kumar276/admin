import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.jsx';
import { AdminProvider } from './context/AdminContext.jsx';
import './styles/index.css';

// Apply the saved theme before first paint.
try {
  const saved = localStorage.getItem('ob-theme');
  if (saved === 'dark' || saved === 'light') document.documentElement.dataset.theme = saved;
} catch (e) {
  /* storage unavailable */
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <AdminProvider>
        <App />
      </AdminProvider>
    </HashRouter>
  </React.StrictMode>
);
