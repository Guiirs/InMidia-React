// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx'; // Ajuste o caminho se necessário
import { ConfirmationProvider } from './context/ConfirmationContext.jsx'; // <<< NOVO IMPORT

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        {/* Envolve o App com o ConfirmationProvider */}
        <ConfirmationProvider> 
          <App />
        </ConfirmationProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);