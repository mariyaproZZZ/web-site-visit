import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './login.module.scss';
import { Title } from '../../ui/title/Title';
import { Logo } from '../../ui/logo/Logo';
import { Input } from '../../ui/input/Input';
import { Button } from '../../ui/button/Button';
import { Link } from '../../ui/link/Link';
import { Footer } from '../../ui/footer/Footer';
import { Modal } from '../../ui/modal/Modal';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  useEffect(() => {
    if (activeModal) {
      const timer = setTimeout(() => {
        setActiveModal(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [activeModal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (login === '1' && password === '1') {
      navigate('/student');
    } else if (login === '2' && password === '2') {
      navigate('/teacher');
    } else {
      setError('Неверные данные');
      setTimeout(() => {
        setError('');
      }, 3000);
    }
  };

  const handlePasswordFocus = () => {
    setShowHint(true);
    setTimeout(() => {
      setShowHint(false);
    }, 5000);
  };

  const modals: Record<string, string> = {
    help: "Введите ваши данные для входа. Убедитесь, что раскладка клавиатуры верная.",
    about: "Этот интерфейс вдохновлен стилистикой Frutiger Aero: стекло, блики и свежесть.",
    feedback: "Напишите нам на: support@university.edu. Мы ответим в течение 24 часов.",
    forgot: "Для восстановления пароля обратитесь в техническую поддержку."
  };

  const footerLinks = [
    { label: 'Помощь', onClick: () => setActiveModal('help') },
    { label: 'О сайте', onClick: () => setActiveModal('about') },
    { label: 'Обратная связь', onClick: () => setActiveModal('feedback') }
  ];

  return (
    <div className={styles.authContainer}>
      <div className={`${styles.authForm} ${styles.fadeInUp}`}>
        
        <div className={styles.authHeader}>
          <Title level={1}>Электронный табель<br />посещаемости</Title>
          <Logo />
        </div>

        <div className={styles.authBody}>
          <Title level={2}>Вход в систему</Title>
          
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <Input
              type="text"
              placeholder="Введите логин"
              label="Логин"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
            />

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Пароль</label>
              <div className={styles.passwordWrapper}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Введите пароль"
                  className={styles.authInput}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={handlePasswordFocus}
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  )}
                </button>
                
                <div className={`${styles.passwordHint} ${showHint ? styles.visible : ''}`}>
                  Пароль должен содержать не менее 8 символов.
                </div>
              </div>
            </div>

            <div className={styles.authMeta}>
              <Link variant="forgot" onClick={() => setActiveModal('forgot')}>
                Забыли пароль?
              </Link>
            </div>

            <div className={styles.authActions}>
              <Button variant="primary" type="submit">
                Войти
              </Button>
            </div>
          </form>
        </div>

        <Footer links={footerLinks} />

        <Modal
          isOpen={!!activeModal}
          content={activeModal ? modals[activeModal] : ''}
          onClose={() => setActiveModal(null)}
        />
      </div>
    </div>
  );
};