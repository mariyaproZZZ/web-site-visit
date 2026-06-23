import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout, getUser } from '../utils/auth';
import { Logo } from '../components/ui/logo/Logo';
import { Modal } from '../components/ui/modal/Modal';
import styles from './mainTeacher.module.scss';

interface Group {
  id: string;
  name: string;
  teacherId: string;
  studentCount: number;
  disciplineCount: number;
}

interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
}

// --- КОМПОНЕНТ ПОДСКАЗКИ ДЛЯ ФУТЕРА ---
const FooterTooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  const handleMouseEnter = () => {
    setIsAnimatingOut(false);
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsAnimatingOut(false);
    }, 300);
  };

  return (
    <div 
      className={styles.footerTooltipWrapper}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div className={`${styles.footerTooltip} ${isAnimatingOut ? styles.tooltipExit : styles.tooltipEnter}`}>
          {text}
        </div>
      )}
    </div>
  );
};

export const MainTeacher: React.FC = () => {
  const navigate = useNavigate();
  const user = getUser();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const tagColors = [
    '#0A84FF',
    '#22c55e',
    '#eab308',
    '#ef4444',
    '#8b5cf6',
    '#ec4899'
  ];

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/groups');
      const data = await response.json();
      
      // Получаем статистику для каждой группы
      const groupsWithStats = await Promise.all(data.map(async (group: any) => {
        try {
          const studentsRes = await fetch(`/api/students?groupId=${group.id}`);
          const students = await studentsRes.json();
          
          const disciplinesRes = await fetch(`/api/disciplines?groupId=${group.id}`);
          const disciplines = await disciplinesRes.json();
          
          return {
            ...group,
            studentCount: students.length,
            disciplineCount: disciplines.length
          };
        } catch {
          return {
            ...group,
            studentCount: 0,
            disciplineCount: 0
          };
        }
      }));
      
      setGroups(groupsWithStats);
    } catch (error) {
      console.error('Ошибка загрузки групп:', error);
      // Тестовые данные
      setGroups([
        { id: '1', name: 'ИС-21', teacherId: '1', studentCount: 4, disciplineCount: 5 },
        { id: '2', name: 'ИС-22', teacherId: '1', studentCount: 3, disciplineCount: 3 },
        { id: '3', name: 'ИС-23', teacherId: '1', studentCount: 3, disciplineCount: 3 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleOpenGroup = (groupId: string) => {
    navigate(`/teacher/group/${groupId}`);
  };

  const notifications: Notification[] = [
    { id: '1', title: 'Новый студент зачислен', description: 'В группу ИС-21 добавлен новый студент', time: '10 минут назад' },
    { id: '2', title: 'Обновление расписания', description: 'Изменения в расписании группы ИС-22', time: '2 часа назад' },
  ];

  return (
    <div className={styles.pageWrapper}>
      <BackgroundCircles />
      <div className={styles.blurCircle1}></div>
      <div className={styles.blurCircle2}></div>
      <div className={styles.blurCircle3}></div>
      <div className={styles.blurCircle4}></div>
      <div className={styles.blurCircle5}></div>
      <div className={styles.blurCircle6}></div>
      <div className={styles.solidCircle1}></div>
      <div className={styles.solidCircle2}></div>
      <div className={styles.solidCircle3}></div>
      <div className={styles.solidCircle4}></div>
      <div className={styles.solidCircle5}></div>
      <div className={styles.solidCircle6}></div>
      <div className={styles.solidCircle7}></div>
      <div className={styles.solidCircle8}></div>
      <div className={styles.gradientCircle}></div>

      <main className={styles.mainContainer}>
        {/* ШАПКА */}
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <div className={styles.headerLogo}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <polyline points="9 12 11 14 15 10"/>
              </svg>
              <span className={styles.logoText}>ГБПОУ КК УСПК — Усть-Лабинский колледж</span>
            </div>
            <div className={styles.headerNav}>
              <button className={`${styles.navBtn} ${styles.profile}`} onClick={() => setShowProfile(true)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Профиль
              </button>
              <button className={`${styles.navBtn} ${styles.notifications}`} onClick={() => setShowNotifications(true)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                Уведомления
                <span className={styles.notificationBadge}>{notifications.length}</span>
              </button>
              <button className={`${styles.navBtn} ${styles.logoutBtn}`} onClick={handleLogout}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Выход
              </button>
            </div>
          </div>
          <div className={styles.headerBottom}>
            <Logo />
            <h1 className={styles.headerTitle}>Электронный табель посещаемости</h1>
          </div>
        </header>

        {/* ПРИВЕТСТВИЕ */}
        <div className={styles.welcomeBlock}>
          <div className={styles.welcomeContent}>
            <div className={styles.welcomeLine}></div>
            <div>
              <h1 className={styles.welcomeTitle}>
                Добро пожаловать, {user?.fullName || 'Преподаватель'}!
              </h1>
              <p className={styles.welcomeSubtitle}>
                Вы успешно зашли в систему. Здесь вы можете управлять группами, просматривать табель посещаемости студентов и создавать опросы.
              </p>
            </div>
          </div>
        </div>

        {/* ГРУППЫ */}
        <div className={styles.groupsSection}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionLine}></div>
            <h2 className={styles.sectionTitle}>Выберите группу</h2>
          </div>
          
          <div className={styles.groupsGrid}>
            {loading ? (
              <div className={styles.loadingText}>Загрузка групп...</div>
            ) : (
              groups.map((group, index) => (
                <div key={group.id} className={styles.groupCard}>
                  <div className={styles.groupTag} style={{ background: tagColors[index % tagColors.length] }}>
                    {group.name}
                  </div>
                  <h3 className={styles.groupName}>Группа {group.name}</h3>
                  <p className={styles.groupInfo}>{group.studentCount} студентов</p>
                  <p className={styles.groupInfo}>{group.disciplineCount} дисциплин</p>
                  <button className={styles.groupBtn} onClick={() => handleOpenGroup(group.id)}>
                    Открыть табель
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* ФУТЕР */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerLinks}>
            <FooterTooltip text="Введите ваши данные для входа. Убедитесь, что раскладка клавиатуры верная.">
              <span className={styles.footerLink}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                Помощь
              </span>
            </FooterTooltip>
            
            <FooterTooltip text="support@university.edu | +7 (999) 123-45-67">
              <span className={styles.footerLink}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Контакты
              </span>
            </FooterTooltip>
            
            <FooterTooltip text="Все права защищены. Данные конфиденциальны.">
              <span className={styles.footerLink}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="3" y1="9" x2="21" y2="9"></line>
                  <line x1="3" y1="15" x2="21" y2="15"></line>
                  <line x1="9" y1="21" x2="9" y2="9"></line>
                </svg>
                Правовая информация
              </span>
            </FooterTooltip>
            
            <FooterTooltip text="Электронный табель посещаемости. Версия 2.0. Разработано в 2026.">
              <span className={styles.footerLink}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22 6 12 13 2 6"></polyline>
                </svg>
                О портале
              </span>
            </FooterTooltip>
          </div>
        </div>
      </footer>

      {/* МОДАЛКИ */}
      <Modal isOpen={showNotifications} onClose={() => setShowNotifications(false)} title="Уведомления">
        <div className={styles.notificationsList}>
          {notifications.map(notif => (
            <div key={notif.id} className={styles.notificationItem}>
              <div className={styles.notificationIcon}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
              </div>
              <div className={styles.notificationContent}>
                <div className={styles.notificationTitle}>{notif.title}</div>
                <div className={styles.notificationDesc}>{notif.description}</div>
                <div className={styles.notificationTime}>{notif.time}</div>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      <Modal isOpen={showProfile} onClose={() => setShowProfile(false)} title="Профиль">
        <div className={styles.profileContent}>
          <div className={styles.profileAvatar}>
            <div className={styles.avatarCircle}>
              {user?.fullName?.charAt(0) || 'П'}
            </div>
          </div>
          <div className={styles.profileInfo}>
            <div className={styles.profileField}>
              <span className={styles.profileLabel}>ФИО</span>
              <span className={styles.profileValue}>{user?.fullName || 'Не указано'}</span>
            </div>
            <div className={styles.profileField}>
              <span className={styles.profileLabel}>Логин</span>
              <span className={styles.profileValue}>{user?.login || 'Не указан'}</span>
            </div>
            <div className={styles.profileField}>
              <span className={styles.profileLabel}>Роль</span>
              <span className={styles.profileValue}>Преподаватель</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const BackgroundCircles = () => (
  <>
    <div style={{
      position: 'fixed',
      width: '600px',
      height: '600px',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(135, 206, 250, 0.4), transparent 70%)',
      filter: 'blur(100px)',
      top: '-200px',
      right: '-200px',
      zIndex: 0,
      pointerEvents: 'none',
    }} />
    <div style={{
      position: 'fixed',
      width: '550px',
      height: '550px',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(146, 205, 71, 0.35), transparent 70%)',
      filter: 'blur(100px)',
      bottom: '-200px',
      left: '-200px',
      zIndex: 0,
      pointerEvents: 'none',
    }} />
    <div style={{
      position: 'fixed',
      width: '400px',
      height: '400px',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(135, 206, 250, 0.2), transparent 70%)',
      filter: 'blur(80px)',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 0,
      pointerEvents: 'none',
    }} />
  </>
);