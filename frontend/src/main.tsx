/**
 * 🎯 ARQUIVO PRINCIPAL DA APLICAÇÃO WHATSUT
 * 
 * Este arquivo configura o ponto de entrada da aplicação React,
 * incluindo o provedor de contexto global e configurações iniciais.
 * 
 * Funcionalidades implementadas:
 * - Renderização da aplicação principal
 * - Configuração do React StrictMode para desenvolvimento
 * - Importação dos estilos globais do Tailwind CSS
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

/**
 * Renderização da aplicação principal
 * 
 * Utiliza React 18 com createRoot para melhor performance
 * e suporte a Concurrent Features
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
