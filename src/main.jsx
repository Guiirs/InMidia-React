// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // <-- 1. ADICIONE ESTA LINHA DE VOLTA
// 1. Importar QueryClient e QueryClientProvider
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// 2. Importar o Devtools (opcional, mas recomendado)
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import App from './App.jsx';
import { AuthProvider } from './context/AuthContext';
import { ConfirmationProvider } from './context/ConfirmationContext';
 // Carregamento do CSS global (do index.html ou daqui)

// 3. Criar uma instância do cliente
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Cache de 5 minutos
      refetchOnWindowFocus: true, // Re-busca dados ao focar na janela
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 4. Envolver a aplicação com o Provider */}
    <QueryClientProvider client={queryClient}>
      {/* 2. O ÚNICO ROUTER DEVE FICAR AQUI */}
      <BrowserRouter>
        <AuthProvider>
          <ConfirmationProvider> 
            <App />
          </ConfirmationProvider>
        </AuthProvider>
      </BrowserRouter>
      {/* FIM DO ROUTER */}

      {/* 5. Adicionar o Devtools (só aparece em desenvolvimento) */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>,
);