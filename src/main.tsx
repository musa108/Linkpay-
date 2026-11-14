import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { PollarProvider } from '@pollar/react';
import '@pollar/react/styles.css';
import App from './App';
import './styles.css';

const apiKey = import.meta.env.VITE_POLLAR_API_KEY as string | undefined;
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      {apiKey ? <PollarProvider client={{ apiKey, stellarNetwork: "testnet" }}><App /></PollarProvider> : <App />}
    </BrowserRouter>
  </React.StrictMode>,
);
