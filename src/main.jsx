import React from 'react';
import ReactDOM from 'react-dom/client';
import App, { ModalProvider, ToastProvider } from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <ModalProvider>
    <ToastProvider>
      <App />
    </ToastProvider>
  </ModalProvider>
);
