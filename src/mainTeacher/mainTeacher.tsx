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

interface Poll {
  id: string;
  disciplineId: number;
  disciplineName: string;
  teacherId: number;
  groupId: number;
  startedAt: string;
  expiresAt: string;
  active: boolean;
}

interface Discipline {
  id: number;
  name: string;
  groupId: number;
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

// Цвета для аватарки
const avatarColors = [
  '#0A84FF',
  '#22c55e',
  '#ef4444',
  '#eab308',
  '#8b5cf6',
  '#ec4899'
];

const AVATAR_COLOR_KEY = 'avatarColor';

export const MainTeacher: React.FC = () => {
  const navigate = useNavigate();
  const user = getUser();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [pollTimeLeft, setPollTimeLeft] = useState(0);
  const [pollSecondsLeft, setPollSecondsLeft] = useState(0);
  const [pollTimer, setPollTimer] = useState<ReturnType<typeof setInterval> | null>(null);
  const [isPollEnding, setIsPollEnding] = useState(false);

  // Состояние для цвета аватарки
  const [selectedColor, setSelectedColor] = useState(() => {
    const savedColor = localStorage.getItem(AVATAR_COLOR_KEY);
    return savedColor && avatarColors.includes(savedColor) ? savedColor : avatarColors[0];
  });

  // Сохраняем цвет аватарки в localStorage
  React.useEffect(() => {
    localStorage.setItem(AVATAR_COLOR_KEY, selectedColor);
  }, [selectedColor]);

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
    fetchPolls();
    fetchDisciplines();
    
    const pollInterval = setInterval(fetchPolls, 5000);
    
    return () => {
      clearInterval(pollInterval);
      if (pollTimer) clearInterval(pollTimer);
    };
  }, []);

  useEffect(() => {
    const activePoll = polls.find(p => p.active);
    if (activePoll) {
      const expiresAt = new Date(activePoll.expiresAt).getTime();
      const now = Date.now();
      const leftSeconds = Math.max(0, Math.floor((expiresAt - now) / 1000));
      const leftMinutes = Math.floor(leftSeconds / 60);
      setPollTimeLeft(leftMinutes);
      setPollSecondsLeft(leftSeconds % 60);
      
      if (pollTimer) {
        clearInterval(pollTimer);
      }
      
      const timer = setInterval(() => {
        const now2 = Date.now();
        const leftSec = Math.max(0, Math.floor((expiresAt - now2) / 1000));
        
        if (leftSec <= 0) {
          clearInterval(timer);
          setPollTimeLeft(0);
          setPollSecondsLeft(0);
          setIsPollEnding(true);
          setTimeout(() => {
            fetchPolls();
            setIsPollEnding(false);
          }, 500);
          return;
        }
        
        setPollTimeLeft(Math.floor(leftSec / 60));
        setPollSecondsLeft(leftSec % 60);
      }, 1000);
      
      setPollTimer(timer);
      
      return () => {
        if (timer) clearInterval(timer);
      };
    } else {
      if (pollTimer) {
        clearInterval(pollTimer);
        setPollTimer(null);
      }
      setPollTimeLeft(0);
      setPollSecondsLeft(0);
      setIsPollEnding(false);
    }
  }, [polls]);

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/groups');
      const data = await response.json();
      
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
      setGroups([
        { id: '1', name: 'ИС-21', teacherId: '1', studentCount: 4, disciplineCount: 5 },
        { id: '2', name: 'ИС-22', teacherId: '1', studentCount: 3, disciplineCount: 3 },
        { id: '3', name: 'ИС-23', teacherId: '1', studentCount: 3, disciplineCount: 3 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPolls = async () => {
    try {
      const response = await fetch('/api/polls');
      const data = await response.json();
      setPolls(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Ошибка загрузки опросов:', error);
      setPolls([]);
    }
  };

  const fetchDisciplines = async () => {
    try {
      const response = await fetch('/api/disciplines');
      const data = await response.json();
      setDisciplines(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Ошибка загрузки дисциплин:', error);
      setDisciplines([]);
    }
  };

  const getDisciplineName = (id: number) => {
    const disc = disciplines.find(d => d.id === id);
    return disc ? disc.name : 'Неизвестно';
  };

  const getGroupName = (groupId: number) => {
    const group = groups.find(g => parseInt(g.id) === groupId);
    return group ? group.name : 'Неизвестно';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleOpenGroup = (groupId: string) => {
    navigate(`/teacher/group/${groupId}`);
  };

  const activePoll = polls.find(p => p.active);

  const getActivePollDisciplineName = () => {
    if (!activePoll) return 'Неизвестно';
    if (activePoll.disciplineName && activePoll.disciplineName !== 'Неизвестно') {
      return activePoll.disciplineName;
    }
    const disc = disciplines.find(d => d.id === activePoll.disciplineId);
    return disc ? disc.name : 'Неизвестно';
  };

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
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                Профиль
              </button>
              <button 
                className={`${styles.navBtn} ${styles.notifications}`} 
                onClick={() => setShowNotifications(true)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                Уведомления
                <span className={styles.notificationBadge}>0</span>
              </button>
              <button className={`${styles.navBtn} ${styles.logoutBtn}`} onClick={handleLogout}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
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

        {activePoll && (
          <div className={`${styles.activePollBlock} ${isPollEnding ? styles.activePollExit : ''}`}>
            <div className={styles.activePollIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <div className={styles.activePollContent}>
              <div className={styles.activePollTitle}>
                <span className={styles.activePollDot}></span>
                Активный опрос
              </div>
              <div className={styles.activePollInfo}>
                <span className={styles.activePollDiscipline}>
                  {getActivePollDisciplineName()}
                </span>
                <span className={styles.activePollGroup}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  {getGroupName(activePoll.groupId)}
                </span>
                <span className={styles.activePollTime}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  {pollTimeLeft} мин {pollSecondsLeft} сек
                </span>
              </div>
            </div>
          </div>
        )}

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

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerLinks}>
            <FooterTooltip text="Введите ваши данные для входа. Убедитесь, что раскладка клавиатуры верная.">
              <span className={styles.footerLink}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                Помощь
              </span>
            </FooterTooltip>
            
            <FooterTooltip text="support@university.edu | +7 (999) 123-45-67">
              <span className={styles.footerLink}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                Контакты
              </span>
            </FooterTooltip>
            
            <FooterTooltip text="Все права защищены. Данные конфиденциальны.">
              <span className={styles.footerLink}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <line x1="3" y1="9" x2="21" y2="9"/>
                  <line x1="3" y1="15" x2="21" y2="15"/>
                  <line x1="9" y1="21" x2="9" y2="9"/>
                </svg>
                Правовая информация
              </span>
            </FooterTooltip>
            
            <FooterTooltip text="Электронный табель посещаемости. Версия 2.0. Разработано в 2026.">
              <span className={styles.footerLink}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22 6 12 13 2 6"/>
                </svg>
                О портале
              </span>
            </FooterTooltip>
          </div>
        </div>
      </footer>

      <Modal isOpen={showNotifications} onClose={() => setShowNotifications(false)} title="Уведомления">
        <div className={styles.notificationsEmpty}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span>Нет уведомлений</span>
        </div>
      </Modal>

      {/* МОДАЛКА ПРОФИЛЯ - полная как у студента */}
      <Modal isOpen={showProfile} onClose={() => setShowProfile(false)} title="Профиль">
        <div className={styles.profileContent}>
          <div className={styles.profileAvatar}>
            <div className={styles.avatarCircle} style={{ background: selectedColor }}>
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
          <div className={styles.profileAvatarColors}>
            <span className={styles.avatarColorsLabel}>Выберите цвет аватарки:</span>
            <div className={styles.avatarColorsList}>
              {avatarColors.map((color) => (
                <div
                  key={color}
                  className={`${styles.avatarColorOption} ${selectedColor === color ? styles.active : ''}`}
                  style={{ background: color }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
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