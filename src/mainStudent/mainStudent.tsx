import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout, getUser } from '../utils/auth';
import {
  ScheduleIcon,
  AttendanceIcon,
  PortfolioIcon
} from '../components/ui/icons/Icons';
import { Modal } from '../components/ui/modal/Modal';
import { Logo } from '../components/ui/logo/Logo';
import styles from './mainStudent.module.scss';

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

interface AttendanceRecord {
  id: string;
  studentId: number;
  disciplineId: number;
  date: string;
  status: string;
}

interface ScheduleItem {
  id: string;
  disciplineId: number;
  groupId: number;
  dayOfWeek: number;
  time: string;
  room: string;
  type: string;
  dateStart?: string;
  dateEnd?: string;
}

interface Discipline {
  id: number;
  name: string;
  groupId: number;
}

const avatarColors = [
  '#0A84FF',
  '#22c55e',
  '#ef4444',
  '#eab308',
  '#8b5cf6',
  '#ec4899',
  '#f97316'
];

const AVATAR_COLOR_KEY = 'avatarColor';

interface PortfolioFile {
  name: string;
  date: string;
  size: string;
  content: string;
  type: string;
}

// --- РЕЗЕРВНЫЙ МАППИНГ ДИСЦИПЛИН ---
const FALLBACK_DISCIPLINES: Record<number, string> = {
  1: 'Высшая математика',
  2: 'Программирование',
  3: 'Физика',
  4: 'Английский язык',
  5: 'Базы данных'
};

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

export const MainStudent: React.FC = () => {
  const navigate = useNavigate();
  const user = getUser();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);

  const [selectedColor, setSelectedColor] = useState(() => {
    const savedColor = localStorage.getItem(AVATAR_COLOR_KEY);
    return savedColor && avatarColors.includes(savedColor) ? savedColor : avatarColors[0];
  });

  const [uploadedFiles, setUploadedFiles] = useState<PortfolioFile[]>(() => {
    const saved = localStorage.getItem('portfolioFiles');
    return saved ? JSON.parse(saved) : [];
  });

  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.setDate(diff));
  });
  const [attendanceView, setAttendanceView] = useState<'week' | 'month'>('week');
  const [attendanceOffset, setAttendanceOffset] = useState(0);

  // Таймер для обновления опросов
  useEffect(() => {
    const interval = setInterval(() => {
      // Обновляем список опросов, проверяя истекшие
      setPolls(prevPolls => 
        prevPolls.map(poll => {
          const now = Date.now();
          const expiresAt = new Date(poll.expiresAt).getTime();
          if (poll.active && now > expiresAt) {
            return { ...poll, active: false };
          }
          return poll;
        })
      );
    }, 30000); // Проверяем каждые 30 секунд

    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    localStorage.setItem(AVATAR_COLOR_KEY, selectedColor);
  }, [selectedColor]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pollsRes, attendanceRes, scheduleRes, disciplinesRes] = await Promise.all([
        fetch('/api/polls'),
        fetch('/api/attendance?studentId=1'),
        fetch('/api/schedule'),
        fetch('/api/disciplines')
      ]);
      
      const pollsData = await pollsRes.json();
      const attendanceData = await attendanceRes.json();
      const scheduleData = await scheduleRes.json();
      const disciplinesData = await disciplinesRes.json();
      
      console.log('=== ДАННЫЕ ИЗ БД ===');
      console.log('Disciplines:', disciplinesData);
      console.log('Schedule:', scheduleData);
      
      setPolls(pollsData);
      setAttendance(attendanceData);
      setSchedule(scheduleData);
      setDisciplines(disciplinesData);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    }
  };

  const getDisciplineName = (id: number): string => {
    const disc = disciplines.find((d: Discipline) => d.id === id);
    if (disc) return disc.name;
    return FALLBACK_DISCIPLINES[id] || 'Неизвестно';
  };

  const getScheduleForWeek = (weekStart: Date) => {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    
    const scheduleMap = new Map<number, ScheduleItem[]>();
    
    schedule
      .filter(item => {
        const dayOffset = item.dayOfWeek - 1;
        const itemDate = new Date(start);
        itemDate.setDate(itemDate.getDate() + dayOffset);
        return itemDate >= start && itemDate <= end && item.dayOfWeek >= 1 && item.dayOfWeek <= 6;
      })
      .forEach(item => {
        const key = item.dayOfWeek;
        if (!scheduleMap.has(key)) {
          scheduleMap.set(key, []);
        }
        scheduleMap.get(key)!.push(item);
      });
    
    for (const [day, items] of scheduleMap) {
      items.sort((a: ScheduleItem, b: ScheduleItem) => a.time.localeCompare(b.time));
    }
    
    return scheduleMap;
  };

  const getAttendanceForPeriod = () => {
    const now = new Date();
    let startDate = new Date(now);
    let endDate = new Date(now);
    
    if (attendanceView === 'week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(now.setDate(diff + attendanceOffset * 7));
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth() + attendanceOffset, 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + attendanceOffset + 1, 0);
    }
    
    return attendance.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= startDate && recordDate <= endDate;
    });
  };

  const downloadFile = (file: PortfolioFile) => {
    const link = document.createElement('a');
    link.href = file.content;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    processFiles(files);
  };

  const processFiles = (files: FileList) => {
    setIsUploading(true);
    const newFiles: PortfolioFile[] = [];
    let processed = 0;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const sizeKB = (file.size / 1024).toFixed(1);
        newFiles.push({
          name: file.name,
          date: new Date().toLocaleDateString('ru-RU'),
          size: sizeKB + ' KB',
          content: content,
          type: file.type || 'application/octet-stream',
        });
        processed++;
        if (processed === files.length) {
          const updatedFiles = [...uploadedFiles, ...newFiles];
          setUploadedFiles(updatedFiles);
          localStorage.setItem('portfolioFiles', JSON.stringify(updatedFiles));
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    processFiles(files);
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    const updatedFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(updatedFiles);
    localStorage.setItem('portfolioFiles', JSON.stringify(updatedFiles));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const weekDays = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

  const scheduleData = [
    { time: '09:00-10:30', subject: 'Высшая математика', type: 'Лекция', room: 'Ауд. 402' },
    { time: '10:45-12:15', subject: 'Программирование', type: 'Практика', room: 'Ауд. 205' },
    { time: '12:45-14:15', subject: 'Физика', type: 'Лекция', room: 'Ауд. 301' },
  ];

  // Фильтруем только активные опросы, у которых время еще не истекло
  const activePolls = polls.filter(p => {
    if (!p.active) return false;
    const now = Date.now();
    const expiresAt = new Date(p.expiresAt).getTime();
    return now < expiresAt;
  });
  
  const attendanceRecords = getAttendanceForPeriod();
  const scheduleMap = getScheduleForWeek(currentWeekStart);

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
                <span className={styles.notificationBadge}>{activePolls.length}</span>
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

        <div className={styles.welcomeBlock}>
          <div className={styles.welcomeContent}>
            <div className={styles.welcomeLine}></div>
            <div>
              <h1 className={styles.welcomeTitle}>
                Добро пожаловать, {user?.fullName || 'Студент'}!
              </h1>
              <p className={styles.welcomeSubtitle}>Вы успешно зашли в систему. Здесь вы можете отслеживать своё расписание и посещаемость.</p>
            </div>
          </div>
        </div>

        <div className={styles.navTiles}>
          <div className={styles.navTile} onClick={() => setShowScheduleModal(true)}>
            <div className={styles.iconWrapper}>
              <ScheduleIcon />
            </div>
            <h3>Расписание</h3>
            <p>Ваше актуальное расписание</p>
          </div>
          <div className={styles.navTile} onClick={() => setShowAttendanceModal(true)}>
            <div className={styles.iconWrapper}>
              <AttendanceIcon />
            </div>
            <h3>Посещаемость</h3>
            <p>Статистика посещений</p>
          </div>
          <div className={styles.navTile} onClick={() => setShowPortfolioModal(true)}>
            <div className={styles.iconWrapper}>
              <PortfolioIcon />
            </div>
            <h3>Портфолио</h3>
            <p>Ваши достижения</p>
          </div>
        </div>

        <div className={styles.workArea}>
          <div className={`${styles.glassCard} ${styles.scheduleBlock}`}>
            <h2>Расписание на сегодня</h2>
            <table className={styles.aeroTable}>
              <thead>
                <tr>
                  <th>Время</th>
                  <th>Дисциплина</th>
                  <th>Тип</th>
                  <th>Аудитория</th>
                </tr>
              </thead>
              <tbody>
                {scheduleData.map((item, index) => (
                  <tr key={index}>
                    <td>{item.time}</td>
                    <td>{item.subject}</td>
                    <td>{item.type}</td>
                    <td>{item.room}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* --- ОПРОСЫ ПО ПОСЕЩАЕМОСТИ --- */}
          <div className={`${styles.glassCard} ${styles.surveysBlock}`}>
            <h2>Опросы по посещаемости</h2>
            <div className={styles.surveysContent}>
              {activePolls.length > 0 ? (
                <div className={styles.pollList}>
                  {activePolls.map(poll => {
                    const timeLeft = Math.max(0, Math.floor((new Date(poll.expiresAt).getTime() - Date.now()) / 60000));
                    // Получаем название дисциплины из списка disciplines
                    const disciplineName = getDisciplineName(poll.disciplineId);
                    const isMarked = attendance.some(
                      a => a.studentId === parseInt(user?.id || '0') && 
                           a.disciplineId === poll.disciplineId && 
                           a.date === new Date().toISOString().split('T')[0]
                    );
                    
                    return (
                      <div key={poll.id} className={styles.pollItem}>
                        <div className={styles.pollIcon}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M12 16v-4"/>
                            <path d="M12 8h.01"/>
                          </svg>
                        </div>
                        <div className={styles.pollInfo}>
                          <div className={styles.pollTitle}>Новый опрос по посещаемости</div>
                          <div className={styles.pollDesc}>
                            Преподаватель начал опрос по предмету "{disciplineName}"
                          </div>
                          <div className={styles.pollTime}>
                            До окончания: {timeLeft} мин
                          </div>
                        </div>
                        <div className={styles.pollActions}>
                          {isMarked ? (
                            <span className={styles.pollMarked}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                              Отмечено
                            </span>
                          ) : (
                            <button 
                              className={styles.pollMarkBtn}
                              onClick={async () => {
                                try {
                                  const today = new Date().toISOString().split('T')[0];
                                  const response = await fetch('/api/attendance', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      studentId: parseInt(user?.id || '0'),
                                      disciplineId: poll.disciplineId,
                                      date: today,
                                      status: 'П'
                                    })
                                  });
                                  const newRecord = await response.json();
                                  setAttendance(prev => [...prev, newRecord]);
                                  alert('Вы успешно отметились на опросе!');
                                } catch (error) {
                                  console.error('Ошибка отметки:', error);
                                  alert('Не удалось отметиться. Попробуйте позже.');
                                }
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34"/>
                                <polygon points="18 2 22 6 12 16 8 16 8 12 18 2"/>
                              </svg>
                              Отметиться
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className={styles.surveysEmpty}>Опроса сейчас нет</p>
              )}
            </div>
          </div>
        </div>
      </main>

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

      {/* Модалка: Уведомления */}
      <Modal isOpen={showNotifications} onClose={() => setShowNotifications(false)} title="Уведомления">
        <div className={styles.notificationsList}>
          {activePolls.length > 0 ? (
            activePolls.map(poll => {
              const disciplineName = getDisciplineName(poll.disciplineId);
              return (
                <div key={poll.id} className={styles.notificationItem}>
                  <div className={styles.notificationIcon}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                  </div>
                  <div className={styles.notificationContent}>
                    <div className={styles.notificationTitle}>Новый опрос по посещаемости</div>
                    <div className={styles.notificationDesc}>Преподаватель начал опрос по предмету "{disciplineName}"</div>
                    <div className={styles.notificationTime}>Осталось {Math.max(0, Math.floor((new Date(poll.expiresAt).getTime() - Date.now()) / 60000))} минут</div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className={styles.notificationsEmpty}>Уведомлений нет</div>
          )}
        </div>
      </Modal>

      {/* Модалка: Профиль */}
      <Modal isOpen={showProfile} onClose={() => setShowProfile(false)} title="Профиль">
        <div className={styles.profileContent}>
          <div className={styles.profileAvatar}>
            <div className={styles.avatarCircle} style={{ background: selectedColor }}>
              {user?.fullName?.charAt(0) || 'С'}
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
              <span className={styles.profileValue}>{user?.role === 'student' ? 'Студент' : 'Преподаватель'}</span>
            </div>
            {user?.groupId && (
              <div className={styles.profileField}>
                <span className={styles.profileLabel}>Группа</span>
                <span className={styles.profileValue}>Группа {user.groupId}</span>
              </div>
            )}
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

      {/* Модалка: Расписание */}
      <Modal 
        isOpen={showScheduleModal} 
        onClose={() => setShowScheduleModal(false)} 
        title="Расписание"
        style={{ maxWidth: '900px', width: '92%', padding: '30px 35px' }}
      >
        <div className={styles.scheduleModalContent}>
          <div className={styles.scheduleControls}>
            <button 
              className={styles.scheduleNavBtn}
              onClick={() => {
                const newDate = new Date(currentWeekStart);
                newDate.setDate(newDate.getDate() - 7);
                setCurrentWeekStart(newDate);
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <span className={styles.schedulePeriod}>
              {currentWeekStart.toLocaleDateString('ru-RU')} - {new Date(currentWeekStart.getTime() + 6*24*60*60*1000).toLocaleDateString('ru-RU')}
            </span>
            <button 
              className={styles.scheduleNavBtn}
              onClick={() => {
                const newDate = new Date(currentWeekStart);
                newDate.setDate(newDate.getDate() + 7);
                setCurrentWeekStart(newDate);
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
          
          <div className={styles.tableScrollWrapper}>
            <table className={styles.aeroTable}>
              <thead>
                <tr>
                  <th style={{ minWidth: '110px' }}>День</th>
                  <th style={{ minWidth: '100px' }}>Время</th>
                  <th style={{ minWidth: '150px' }}>Дисциплина</th>
                  <th style={{ minWidth: '90px' }}>Тип</th>
                  <th style={{ minWidth: '110px' }}>Аудитория</th>
                </tr>
              </thead>
              <tbody>
                {scheduleMap.size === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                      На эту неделю расписания нет
                    </td>
                  </tr>
                ) : (
                  [1, 2, 3, 4, 5, 6].map(day => {
                    const items = scheduleMap.get(day) || [];
                    if (items.length === 0) return null;
                    const dayName = weekDays[day - 1];
                    const dayDate = new Date(currentWeekStart);
                    dayDate.setDate(dayDate.getDate() + (day - 1));
                    const dateStr = dayDate.toLocaleDateString('ru-RU');
                    
                    return items.map((item, index) => (
                      <tr key={`${day}-${index}`}>
                        {index === 0 ? (
                          <td rowSpan={items.length} style={{ fontWeight: '700', verticalAlign: 'middle', minWidth: '110px' }}>
                            {dayName}<br />
                            <span style={{ fontSize: '12px', fontWeight: '400', color: '#64748b' }}>
                              {dateStr}
                            </span>
                          </td>
                        ) : null}
                        <td style={{ whiteSpace: 'nowrap' }}>{item.time}</td>
                        <td>{getDisciplineName(item.disciplineId)}</td>
                        <td>{item.type}</td>
                        <td>{item.room}</td>
                      </tr>
                    ));
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* Модалка: Посещаемость */}
      <Modal isOpen={showAttendanceModal} onClose={() => setShowAttendanceModal(false)} title="Дневник посещаемости">
        <div className={styles.attendanceModalContent}>
          <div className={styles.attendanceControls}>
            <div className={styles.attendanceViewToggle}>
              <button 
                className={`${styles.viewBtn} ${attendanceView === 'week' ? styles.activeView : ''}`}
                onClick={() => { setAttendanceView('week'); setAttendanceOffset(0); }}
              >
                Неделя
              </button>
              <button 
                className={`${styles.viewBtn} ${attendanceView === 'month' ? styles.activeView : ''}`}
                onClick={() => { setAttendanceView('month'); setAttendanceOffset(0); }}
              >
                Месяц
              </button>
            </div>
            <div className={styles.attendanceNav}>
              <button 
                className={styles.attendanceNavBtn}
                onClick={() => setAttendanceOffset(attendanceOffset - (attendanceView === 'week' ? 1 : 1))}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              <span className={styles.attendancePeriod}>
                {attendanceView === 'week' 
                  ? `${new Date(new Date().setDate(new Date().getDate() + attendanceOffset * 7)).toLocaleDateString('ru-RU')} - ${new Date(new Date().setDate(new Date().getDate() + attendanceOffset * 7 + 6)).toLocaleDateString('ru-RU')}`
                  : new Date(new Date().getFullYear(), new Date().getMonth() + attendanceOffset, 1).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
                }
              </span>
              <button 
                className={styles.attendanceNavBtn}
                onClick={() => setAttendanceOffset(attendanceOffset + (attendanceView === 'week' ? 1 : 1))}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          </div>
          <div className={styles.tableScrollWrapper}>
            <table className={styles.aeroTable}>
              <thead>
                <tr>
                  <th>Предмет</th>
                  <th>Дата</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.map((record, index) => (
                  <tr key={index}>
                    <td>{getDisciplineName(record.disciplineId)}</td>
                    <td>{new Date(record.date).toLocaleDateString('ru-RU')}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${record.status === 'P' ? styles.statusPresent : styles.statusAbsent}`}>
                        {record.status === 'P' ? 'Присутствовал' : 'Отсутствовал'}
                      </span>
                    </td>
                  </tr>
                ))}
                {attendanceRecords.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                      За этот период записей нет
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* Модалка: Портфолио */}
      <Modal isOpen={showPortfolioModal} onClose={() => setShowPortfolioModal(false)} title="Портфолио достижений">
        <div className={styles.portfolioContent}>
          <div className={styles.portfolioUpload}>
            <label
              className={`${styles.uploadBtn} ${isDragging ? styles.dragging : ''}`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              {isDragging ? 'Отпустите файлы здесь' : 'Загрузить достижение'}
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {isUploading && (
            <div className={styles.uploadProgress}>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: '60%' }}></div>
              </div>
              <span className={styles.progressText}>Загрузка файлов...</span>
            </div>
          )}

          <div className={styles.portfolioList}>
            {uploadedFiles.length === 0 ? (
              <div className={styles.portfolioEmpty}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
                <span>Нет загруженных достижений</span>
                <p>Нажмите на кнопку выше или перетащите файлы сюда</p>
              </div>
            ) : (
              uploadedFiles.map((file, index) => (
                <div key={index} className={styles.portfolioItem}>
                  <div className={styles.portfolioIcon}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                  </div>
                  <div className={styles.portfolioInfo}>
                    <div className={styles.portfolioTitle}>{file.name}</div>
                    <div className={styles.portfolioDate}>Загружено: {file.date} • {file.size}</div>
                  </div>
                  <div className={styles.portfolioActions}>
                    <button
                      className={styles.portfolioDownload}
                      onClick={() => downloadFile(file)}
                      title="Скачать файл"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                    </button>
                    <button
                      className={styles.portfolioDelete}
                      onClick={() => removeFile(index)}
                      title="Удалить файл"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
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