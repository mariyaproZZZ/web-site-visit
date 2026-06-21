import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/app'; // Путь до твоего главного файла App
import './index.css'; // Или какой у тебя глобальный файл стилей в src, если есть

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);