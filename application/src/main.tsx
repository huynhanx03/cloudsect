import React from 'react';
import ReactDOM from 'react-dom/client';
import './shared/i18n';
import App from './app/App';
import './shared/styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>,
);
