import React, { useState, useEffect } from 'react';
import styles from './login.module.scss';

export const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Автоматическое скрытие модального окна через 5 секунд
  useEffect(() => {
    if (activeModal) {
      const timer = setTimeout(() => {
        setActiveModal(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [activeModal]);

  const handlePasswordFocus = () => {
    setShowHint(true);
    setTimeout(() => {
      setShowHint(false);
    }, 5000);
  };

  const modals: Record<string, string> = {
    help: "Введите ваши данные для входа. Убедитесь, что раскладка клавиатуры верная.",
    about: "Этот интерфейс вдохновлен стилистикой Frutiger Aero: стекло, блики и свежесть.",
    feedback: "Напишите нам на: support@university.edu. Мы ответим в течение 24 часов."
  };

  return (
    <div className={styles.authContainer}>
      <div className={`${styles.authForm} ${styles.fadeInUp}`}>
        
        {/* Шапка с заголовком и лого */}
        <div className={styles.authHeader}>
          <h1 className={styles.authTitle}>Электронный табель<br />посещаемости</h1>
          <div className={styles.authLogoWrapper}>
            <svg 
              className={styles.authLogo} 
              viewBox="0 0 800 600" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8DEBFF"/>
                  <stop offset="100%" stopColor="#0A84FF"/>
                </linearGradient>

                <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3DE6FF"/>
                  <stop offset="100%" stopColor="#7CFF3D"/>
                </linearGradient>

                <filter id="glow">
                  <feGaussianBlur stdDeviation="4" result="blur"/>
                  <feMerge>
                    <feMergeNode in="blur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              <path
                d="M170 420
                   C110 350 120 270 210 240
                   C320 200 540 180 670 240
                   C760 280 740 390 620 450"
                fill="none"
                stroke="url(#greenGrad)"
                strokeWidth="28"
                strokeLinecap="round"
                filter="url(#glow)"
                opacity="0.9"/>

              <circle
                cx="300"
                cy="170"
                r="75"
                fill="url(#blueGrad)"
                stroke="#0A84FF"
                strokeWidth="6"/>

              <path
                d="M185 360
                   C185 280 245 245 300 245
                   C355 245 415 280 415 360
                   L415 405
                   L185 405 Z"
                fill="url(#blueGrad)"
                stroke="#0A84FF"
                strokeWidth="6"/>

              <ellipse
                cx="300"
                cy="425"
                rx="145"
                ry="28"
                fill="url(#greenGrad)"
                opacity="0.6"/>

              <g transform="translate(430,210) rotate(6)">
                <rect
                  x="0"
                  y="0"
                  width="220"
                  height="260"
                  rx="20"
                  fill="#F5FCFF"
                  stroke="#0A84FF"
                  strokeWidth="6"/>

                <line x1="25" y1="65" x2="95" y2="65" stroke="#0A84FF" strokeWidth="10" strokeLinecap="round"/>
                <line x1="25" y1="125" x2="95" y2="125" stroke="#0A84FF" strokeWidth="10" strokeLinecap="round"/>
                <line x1="25" y1="185" x2="95" y2="185" stroke="#0A84FF" strokeWidth="10" strokeLinecap="round"/>

                <path d="M145 60 L160 75 L190 40"
                      fill="none"
                      stroke="#35C84A"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeLinejoin="round"/>

                <path d="M145 120 L160 135 L190 100"
                      fill="none"
                      stroke="#35C84A"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeLinejoin="round"/>

                <line x1="125" y1="185" x2="185" y2="185" stroke="#0A84FF" strokeWidth="10" strokeLinecap="round"/>
              </g>
            </svg>
          </div>
        </div>

        <div className={styles.authBody}>
          <h2 className={styles.authSubtitle}>Вход в систему</h2>
          
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Логин</label>
            <input type="text" placeholder="Введите логин" className={styles.authInput} />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Пароль</label>
            <div className={styles.passwordWrapper}>
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Введите пароль" 
                className={styles.authInput}
                onFocus={handlePasswordFocus}
              />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  // Глаз открытый - пароль видно
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  // Глаз закрытый - пароль скрыт
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                )}
              </button>
              
              {/* Подсказка, реагирующая на состояние showHint */}
              <div className={`${styles.passwordHint} ${showHint ? styles.visible : ''}`}>
                Пароль должен содержать не менее 8 символов.
              </div>
            </div>
          </div>

          <div className={styles.authMeta}>
            <a href="#forgot" className={styles.authForgot}>Забыли пароль?</a>
          </div>

          <div className={styles.authActions}>
            <button type="button" className={styles.authBtn}>Войти</button>
          </div>
        </div>

        {/* Подвал с обработчиками */}
        <div className={styles.authFooter}>
          <div className={styles.footerLink} onClick={() => setActiveModal('help')}>Помощь</div>
          <div className={styles.footerLink} onClick={() => setActiveModal('about')}>О сайте</div>
          <div className={styles.footerLink} onClick={() => setActiveModal('feedback')}>Обратная связь</div>
        </div>

        {/* Модальное окно */}
        {activeModal && (
          <div className={styles.infoModal}>
            <p style={{textAlign: 'center', margin: 0}}>{modals[activeModal]}</p>
            <button className={styles.closeBtn} onClick={() => setActiveModal(null)}>
              Закрыть
            </button>
          </div>
        )}
      </div>
    </div>
  );
};