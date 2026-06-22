import React, { useState } from 'react';
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

// --- КРУГИ ДЛЯ ФОНА ---
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

// Цвета для аватарки
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

// Тип для файла в портфолио
interface PortfolioFile {
  name: string;
  date: string;
  size: string;
  content: string;
  type: string;
}

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

  React.useEffect(() => {
    localStorage.setItem(AVATAR_COLOR_KEY, selectedColor);
  }, [selectedColor]);

  // --- ПОРТФОЛИО: состояния для загрузки файлов ---
  const [uploadedFiles, setUploadedFiles] = useState<PortfolioFile[]>(() => {
    const saved = localStorage.getItem('portfolioFiles');
    return saved ? JSON.parse(saved) : [];
  });

  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // --- Функция для скачивания файла ---
  const downloadFile = (file: PortfolioFile) => {
    const link = document.createElement('a');
    link.href = file.content;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Обработчики для Drag & Drop ---
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

  // --- Общая функция обработки файлов ---
  const processFiles = (files: FileList) => {
    setIsUploading(true);

    const newFiles: PortfolioFile[] = [];

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

        if (newFiles.length === files.length) {
          const updatedFiles = [...uploadedFiles, ...newFiles];
          setUploadedFiles(updatedFiles);
          localStorage.setItem('portfolioFiles', JSON.stringify(updatedFiles));
          setIsUploading(false);
        }
      };

      reader.readAsDataURL(file);
    }
  };

  // --- Обработчик загрузки через кнопку ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    processFiles(files);
    e.target.value = '';
  };

  // --- Удаление файла ---
  const removeFile = (index: number) => {
    const updatedFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(updatedFiles);
    localStorage.setItem('portfolioFiles', JSON.stringify(updatedFiles));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Данные для расписания
  const scheduleData = [
    { time: '09:00-10:30', subject: 'Высшая математика', type: 'Лекция', room: 'Ауд. 402' },
    { time: '10:45-12:15', subject: 'Программирование', type: 'Практика', room: 'Ауд. 205' },
    { time: '12:45-14:15', subject: 'Физика', type: 'Лекция', room: 'Ауд. 301' },
  ];

  // Данные для посещаемости (дневник)
  const attendanceData = [
    { subject: 'Высшая математика', date: '10.06.2026', status: 'Присутствовал' },
    { subject: 'Программирование', date: '10.06.2026', status: 'Присутствовал' },
    { subject: 'Физика', date: '09.06.2026', status: 'Отсутствовал' },
    { subject: 'Высшая математика', date: '08.06.2026', status: 'Присутствовал' },
    { subject: 'Программирование', date: '08.06.2026', status: 'Присутствовал' },
    { subject: 'Физика', date: '07.06.2026', status: 'Присутствовал' },
  ];

  // Уведомления
  const notifications = [
    { id: 1, title: 'Новый опрос по посещаемости', description: 'Преподаватель начал опрос по предмету "Программирование"', time: '5 минут назад' },
    { id: 2, title: 'Опрос завершён', description: 'Опрос по "Высшей математике" завершён. Результаты доступны.', time: '15 минут назад' },
    { id: 3, title: 'Начинается опрос', description: 'Преподаватель объявил опрос по "Физике" через 10 минут.', time: '30 минут назад' },
  ];

  return (
    <div className={styles.pageWrapper}>
      {/* ФОНОВЫЕ РАСТУШЕВАННЫЕ КРУГИ */}
      <BackgroundCircles />

      {/* Остальные круги */}
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

      {/* ОСНОВНОЙ КОНТЕНТ */}
      <main className={styles.mainContainer}>
       {/* --- ШАПКА --- */}
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
      <span className={styles.navItem} onClick={() => setShowProfile(true)} style={{ cursor: 'pointer' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        Профиль
      </span>
      <span className={styles.navItem} onClick={() => setShowNotifications(true)} style={{ cursor: 'pointer' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        Уведомления
        <span className={styles.notificationBadge}>3</span>
      </span>
      <span className={`${styles.navItem} ${styles.logout}`} onClick={handleLogout} style={{ cursor: 'pointer' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
        Выход
      </span>
    </div>
  </div>
  <div className={styles.headerBottom}>
    <Logo />
    <h1 className={styles.headerTitle}>Электронный табель посещаемости</h1>
  </div>
</header>

        {/* --- БЛОК ПРИВЕТСТВИЯ --- */}
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

        {/* --- РАЗДЕЛЫ ПОРТАЛА --- */}
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

        {/* --- ОСНОВНАЯ РАБОЧАЯ ОБЛАСТЬ --- */}
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
          <div className={`${styles.glassCard} ${styles.surveysBlock}`}>
            <h2>Опросы по посещаемости</h2>
            <div className={styles.surveysContent}>
              <p className={styles.surveysEmpty}>Опроса сейчас нет</p>
            </div>
          </div>
        </div>
      </main>

      {/* --- ФУТЕР --- */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerLinks}>
            <span className={styles.footerLink}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              Помощь
            </span>
            <span className={styles.footerLink}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              Контакты
            </span>
            <span className={styles.footerLink}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="3" y1="15" x2="21" y2="15"></line>
                <line x1="9" y1="21" x2="9" y2="9"></line>
              </svg>
              Правовая информация
            </span>
            <span className={styles.footerLink}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22 6 12 13 2 6"></polyline>
              </svg>
              О портале
            </span>
          </div>
        </div>
      </footer>

      {/* --- МОДАЛЬНЫЕ ОКНА --- */}
      {/* Модалка уведомлений */}
      <Modal isOpen={showNotifications} onClose={() => setShowNotifications(false)} title="Уведомления">
        <div className={styles.notificationsList}>
          {notifications.map((notif) => (
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

      {/* Модалка профиля */}
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

      {/* Модалка расписания */}
      <Modal isOpen={showScheduleModal} onClose={() => setShowScheduleModal(false)} title="Расписание">
        <div className={styles.scheduleModalContent}>
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
      </Modal>

      {/* Модалка посещаемости */}
      <Modal isOpen={showAttendanceModal} onClose={() => setShowAttendanceModal(false)} title="Дневник посещаемости">
        <div className={styles.attendanceModalContent}>
          <table className={styles.aeroTable}>
            <thead>
              <tr>
                <th>Предмет</th>
                <th>Дата</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {attendanceData.map((item, index) => (
                <tr key={index}>
                  <td>{item.subject}</td>
                  <td>{item.date}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${item.status === 'Присутствовал' ? styles.statusPresent : styles.statusAbsent}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* --- МОДАЛЬНОЕ ОКНО: ПОРТФОЛИО --- */}
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