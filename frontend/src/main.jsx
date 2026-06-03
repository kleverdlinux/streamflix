import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1C1C2E',
            color: '#F0F0FF',
            border: '1px solid rgba(108, 99, 255, 0.2)',
            backdropFilter: 'blur(20px)',
          },
          success: {
            iconTheme: { primary: '#43E97B', secondary: '#0A0A0F' },
          },
          error: {
            iconTheme: { primary: '#FF6584', secondary: '#0A0A0F' },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
