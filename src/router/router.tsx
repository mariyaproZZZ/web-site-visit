import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '../components/pages/login/login';
import { MainStudent } from '../mainStudent/mainStudent';

// Временный пустой компонент для страницы преподавателя, чтобы не было ошибок
const MainTeacher = () => (
  <div style={{ padding: '20px', color: '#fff', textAlign: 'center' }}>
    <h2>Главная страница преподавателя (В разработке)</h2>
  </div>
);

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* По умолчанию открывается страница логина */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Страница авторизации */}
        <Route path="/login" element={<Login />} />
        
        {/* Главная страница студента */}
        <Route path="/student" element={<MainStudent />} />
        
        {/* Главная страница преподавателя */}
        <Route path="/teacher" element={<MainTeacher />} />
        
        {/* Если ввели несуществующий адрес — кидаем на логин */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};