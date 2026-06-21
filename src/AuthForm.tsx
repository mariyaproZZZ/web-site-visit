import React, { useState } from 'react';
import './AuthForm.css';
import authIcon from './assets/auth-icon.png';

const AuthForm: React.FC = () => {
  // Состояние роли: 'student' (студент) или 'teacher' (преподаватель)
  const [role, setRole] = useState<'student' | 'teacher'>('student');

  return (
    <div className="auth-container">
      <div className="auth-form">
        
        {/* Шапка формы (Пропорция 1.6 / 4) */}
        <div className="auth-header">
          <h1 className="auth-title">
            Электронный табель<br />посещаемости
          </h1>
          <div className="auth-logo-wrapper">
            <img src={authIcon} alt="Логотип" className="auth-logo" />
          </div>
        </div>

        {/* Контентная часть формы */}
        <div className="auth-body">
          {/* Надпись меняется в зависимости от активной формы */}
          <p className="auth-subtitle">
            {role === 'student' ? 'Вход для студента' : 'Вход для преподавателя'}
          </p>
          
          {/* Группа Логина */}
          <div className="input-group">
            <label className="input-label">Логин:</label>
            <input type="text" placeholder="Введите логин" className="auth-input" />
          </div>

          {/* Группа Пароля */}
          <div className="input-group">
            <label className="input-label">Пароль</label>
            <input type="password" placeholder="***********" className="auth-input" />
          </div>

          {/* Ссылка восстановления доступа */}
          <div className="auth-meta">
            <a href="#" className="auth-forgot">Забыли пароль?</a>
          </div>

          {/* Кнопка Войти и переключатель форм */}
          <div className="auth-actions">
            <button type="submit" className="auth-btn">Войти</button>
            
            {/* Ссылка динамически меняет форму на противоположную при клике */}
            <span 
              className="auth-role-toggle" 
              onClick={() => setRole(role === 'student' ? 'teacher' : 'student')}
            >
              {role === 'student' ? 'Вход для преподавателя' : 'Вход для студента'}
            </span>
          </div>
        </div>

        {/* Нижняя панель */}
        <div className="auth-footer">
          <a href="#" className="footer-link">Помощь</a>
          <a href="#" className="footer-link">🌐 О сайте</a>
          <a href="#" className="footer-link">Главная</a>
          <a href="#" className="footer-link">👥 Обратная связь</a>
        </div>

      </div>
    </div>
  );
};

export default AuthForm;