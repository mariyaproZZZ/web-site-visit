import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { logout, getUser } from '../utils/auth';
import { Logo } from '../components/ui/logo/Logo';
import { Modal } from '../components/ui/modal/Modal';
import styles from './groupAttendance.module.scss';

interface Student {
  id: string;
  fullName: string;
  groupId: number;
}

interface Discipline {
  id: number;
  name: string;
  groupId: number;
}

interface AttendanceRecord {
  id: string;
  studentId: number;
  disciplineId: number;
  date: string;
  status: string;
}

interface Poll {
  id: string;
  disciplineId: number;
  teacherId: number;
  groupId: number;
  startedAt: string;
  expiresAt: string;
  active: boolean;
  disciplineName: string;
}

const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const monthNames = ['Января', 'Февраля', 'Марта', 'Апреля', 'Мая', 'Июня', 'Июля', 'Августа', 'Сентября', 'Октября', 'Ноября', 'Декабря'];

const avatarColors = [
  '#0A84FF',
  '#22c55e',
  '#ef4444',
  '#eab308',
  '#8b5cf6',
  '#ec4899'
];

const AVATAR_COLOR_KEY = 'avatarColor';

export const GroupAttendance: React.FC = () => {
  const navigate = useNavigate();
  const user = getUser();
  const { groupId } = useParams<{ groupId: string }>();

  const [group, setGroup] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [selectedDiscipline, setSelectedDiscipline] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedColor, setSelectedColor] = useState(() => {
    const savedColor = localStorage.getItem(AVATAR_COLOR_KEY);
    return savedColor && avatarColors.includes(savedColor) ? savedColor : avatarColors[0];
  });
  const [weekStart, setWeekStart] = useState<Date>(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.setDate(diff));
  });
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [pollMinutes, setPollMinutes] = useState(15);
  const [pollDiscipline, setPollDiscipline] = useState<number | null>(null);
  const [isPollActive, setIsPollActive] = useState(false);
  const [pollTimer, setPollTimer] = useState<ReturnType<typeof setInterval> | null>(null);
  const [pollTimeLeft, setPollTimeLeft] = useState(0);
  const [pollSecondsLeft, setPollSecondsLeft] = useState(0);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingCancelPoll, setPendingCancelPoll] = useState<Poll | null>(null);

  React.useEffect(() => {
    localStorage.setItem(AVATAR_COLOR_KEY, selectedColor);
  }, [selectedColor]);

  useEffect(() => {
    if (groupId) {
      fetchGroupData(groupId);
      fetchPolls();
      
      // Обновляем данные каждые 3 секунды для实时 синхронизации
      const interval = setInterval(() => {
        if (groupId) {
          fetchAttendanceData(groupId);
        }
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [groupId]);

  // Обновляем опросы при изменении списка дисциплин
  useEffect(() => {
    if (disciplines.length > 0) {
      setPolls(prevPolls => 
        prevPolls.map(poll => {
          if (!poll.disciplineName || poll.disciplineName === 'Неизвестно' || poll.disciplineName === '') {
            const disc = disciplines.find(d => d.id === poll.disciplineId);
            if (disc) {
              return { ...poll, disciplineName: disc.name };
            }
          }
          return poll;
        })
      );
    }
  }, [disciplines]);

  useEffect(() => {
    const activePoll = polls.find(p => p.active && p.groupId === parseInt(groupId || '0'));
    if (activePoll) {
      setIsPollActive(true);
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
          setIsPollActive(false);
          setPollTimeLeft(0);
          setPollSecondsLeft(0);
          // Завершаем опрос и обновляем страницу
          handlePollEnd(activePoll).then(() => {
            Promise.all([
              fetchPolls(),
              fetchGroupData(groupId || '')
            ]).then(() => {
              setIsPollActive(false);
            });
          });
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
      setIsPollActive(false);
      if (pollTimer) {
        clearInterval(pollTimer);
        setPollTimer(null);
      }
      setPollTimeLeft(0);
      setPollSecondsLeft(0);
    }
  }, [polls, groupId]);

  useEffect(() => {
    const checkExpired = setInterval(() => {
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
    }, 5000);

    return () => clearInterval(checkExpired);
  }, []);

  const fetchGroupData = async (id: string) => {
    try {
      const [groupRes, studentsRes, disciplinesRes] = await Promise.all([
        fetch(`/api/groups/${id}`),
        fetch(`/api/students?groupId=${id}`),
        fetch(`/api/disciplines?groupId=${id}`)
      ]);

      const groupData = await groupRes.json();
      const studentsData = await studentsRes.json();
      const disciplinesData = await disciplinesRes.json();

      setGroup(groupData);
      setStudents(studentsData);
      setDisciplines(disciplinesData);
      
      if (disciplinesData.length > 0) {
        setSelectedDiscipline(disciplinesData[0].id);
        setPollDiscipline(disciplinesData[0].id);
      }
      
      // Загружаем посещаемость отдельно
      await fetchAttendanceData(id);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  // Новая функция для обновления только посещаемости
  const fetchAttendanceData = async (id: string) => {
    try {
      const attendanceRes = await fetch(`/api/attendance`);
      const attendanceData = await attendanceRes.json();
      setAttendance(Array.isArray(attendanceData) ? attendanceData : []);
    } catch (error) {
      console.error('Ошибка загрузки посещаемости:', error);
    }
  };

  const fetchPolls = async () => {
    try {
      const response = await fetch('/api/polls');
      const data = await response.json();
      
      const pollsWithNames = Array.isArray(data) ? data.map((poll: Poll) => {
        if (!poll.disciplineName || poll.disciplineName === 'Неизвестно' || poll.disciplineName === '') {
          const disc = disciplines.find(d => d.id === poll.disciplineId);
          if (disc) {
            return { ...poll, disciplineName: disc.name };
          }
        }
        return poll;
      }) : [];
      
      setPolls(pollsWithNames);
    } catch (error) {
      console.error('Ошибка загрузки опросов:', error);
    }
  };

  const getDisciplineName = (id: number | string) => {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    const disc = disciplines.find(d => d.id === numericId);
    return disc ? disc.name : 'Неизвестно';
  };

  const getStudentAttendance = (studentId: number, disciplineId: number, date: string) => {
    const record = attendance.find(
      a => a.studentId === studentId && a.disciplineId === disciplineId && a.date === date
    );
    return record ? record.status : '-';
  };

  const getWeekDates = () => {
    const start = new Date(weekStart);
    const dates = [];
    let dayCount = 0;
    let i = 0;
    while (dayCount < 6 && i < 10) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      if (d.getDay() !== 0) {
        dates.push(d);
        dayCount++;
      }
      i++;
    }
    return dates;
  };

  const getMonthDates = () => {
    const dates = [];
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(selectedYear, selectedMonth, i);
      if (d.getDay() !== 0) {
        dates.push(d);
      }
    }
    return dates;
  };

  const getDayDate = () => {
    return new Date(currentDate);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleGoBack = () => {
    navigate('/teacher');
  };

  const updateAttendance = async (studentId: number, disciplineId: number, date: string, status: string) => {
    const existing = attendance.find(
      a => a.studentId === studentId && a.disciplineId === disciplineId && a.date === date
    );

    try {
      if (existing) {
        await fetch(`/api/attendance/${existing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        });
        setAttendance(prev =>
          prev.map(a => a.id === existing.id ? { ...a, status } : a)
        );
      } else {
        const newRecord = {
          studentId,
          disciplineId,
          date,
          status
        };
        const response = await fetch('/api/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newRecord)
        });
        const created = await response.json();
        setAttendance(prev => [...prev, created]);
      }
    } catch (error) {
      console.error('Ошибка обновления посещаемости:', error);
    }
  };

  const handleWeekChange = (direction: number) => {
    const newDate = new Date(weekStart);
    newDate.setDate(newDate.getDate() + direction * 7);
    setWeekStart(newDate);
  };

  const handleMonthChange = (direction: number) => {
    let newMonth = selectedMonth + direction;
    let newYear = selectedYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  const formatWeekRange = () => {
    const start = new Date(weekStart);
    const end = new Date(weekStart);
    let daysToAdd = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      if (d.getDay() === 6) {
        daysToAdd = i;
        break;
      }
    }
    end.setDate(end.getDate() + daysToAdd);
    return `${start.getDate()} ${monthNames[start.getMonth()]} по ${end.getDate()} ${monthNames[end.getMonth()]}`;
  };

  const getCurrentDates = () => {
    if (viewMode === 'day') {
      return [getDayDate()];
    } else if (viewMode === 'week') {
      return getWeekDates();
    } else {
      return getMonthDates();
    }
  };

  const startPoll = async () => {
    if (!pollDiscipline) {
      alert('Выберите дисциплину для опроса');
      return;
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + pollMinutes * 60000);
    
    const discipline = disciplines.find(d => d.id === pollDiscipline);
    const disciplineName = discipline ? discipline.name : 'Неизвестно';

    const newPoll = {
      disciplineId: pollDiscipline,
      teacherId: parseInt(user?.id || '1'),
      groupId: parseInt(groupId || '0'),
      startedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      active: true,
      disciplineName: disciplineName
    };

    try {
      const response = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPoll)
      });
      const created = await response.json();
      setPolls(prev => [...prev, created]);
      setIsPollActive(true);
      setPollTimeLeft(pollMinutes);
      setPollSecondsLeft(0);
      
      await fetchPolls();
    } catch (error) {
      console.error('Ошибка создания опроса:', error);
    }
  };

  const showCancelConfirmation = (poll: Poll) => {
    setPendingCancelPoll(poll);
    setShowConfirmModal(true);
  };

  const confirmCancelPoll = async () => {
    if (!pendingCancelPoll) return;
    
    setShowConfirmModal(false);
    const activePoll = pendingCancelPoll;
    setPendingCancelPoll(null);

    try {
      await fetch(`/api/polls/${activePoll.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: false })
      });

      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Опрос отменён',
          description: `Преподаватель ${user?.fullName || 'Преподаватель'} отменил опрос по "${getDisciplineName(activePoll.disciplineId)}"`,
          type: 'poll_cancelled',
          data: { 
            groupId: groupId,
            disciplineId: activePoll.disciplineId,
            teacherName: user?.fullName
          }
        })
      });

      setPolls(prev => prev.map(p => p.id === activePoll.id ? { ...p, active: false } : p));
      setIsPollActive(false);
      setPollTimeLeft(0);
      setPollSecondsLeft(0);
      
      if (pollTimer) {
        clearInterval(pollTimer);
        setPollTimer(null);
      }
      
      await Promise.all([
        fetchPolls(),
        fetchGroupData(groupId || '')
      ]);
    } catch (error) {
      console.error('Ошибка отмены опроса:', error);
      alert('Не удалось отменить опрос');
    }
  };

  const cancelCancelPoll = () => {
    setShowConfirmModal(false);
    setPendingCancelPoll(null);
  };

  // ИСПРАВЛЕННАЯ ФУНКЦИЯ handlePollEnd
  const handlePollEnd = async (poll: Poll) => {
    const today = new Date().toISOString().split('T')[0];
    const disciplineId = poll.disciplineId;
    
    // Сначала обновляем данные посещаемости с сервера
    await fetchAttendanceData(groupId || '');
    
    // Получаем актуальные записи посещаемости для этой дисциплины на сегодня
    const existingRecords = attendance.filter(
      a => a.disciplineId === disciplineId && a.date === today
    );
    
    // Создаем Set из ID студентов, которые уже отметились
    const markedStudentIds = new Set(existingRecords.map(r => r.studentId));
    
    // Для каждого студента в группе
    for (const student of students) {
      const studentId = parseInt(student.id);
      
      // Проверяем, отметился ли студент
      if (!markedStudentIds.has(studentId)) {
        // Если не отметился - создаем запись с статусом 'Н'
        await updateAttendance(
          studentId,
          disciplineId,
          today,
          'Н'
        );
      }
      // Если отметился - запись уже есть с статусом 'П', ничего не меняем
    }
    
    // Завершаем опрос на сервере
    try {
      await fetch(`/api/polls/${poll.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: false })
      });
    } catch (error) {
      console.error('Ошибка завершения опроса:', error);
    }
    
    // Обновляем данные после завершения
    await fetchAttendanceData(groupId || '');
  };

  const downloadReport = () => {
    const currentDates = getCurrentDates();
    const filteredDates = currentDates.filter(date => date.getDay() !== 0);
    
    const totalColumns = 3 + filteredDates.length + 3;
    const isLandscape = totalColumns > 10 || viewMode === 'month';
    const pageOrientation = isLandscape ? 'Landscape' : 'Portrait';
    
    let periodTitle = '';
    if (viewMode === 'day') {
      const date = filteredDates[0];
      periodTitle = `За ${date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    } else if (viewMode === 'week') {
      const start = filteredDates[0];
      const end = filteredDates[filteredDates.length - 1];
      periodTitle = `За неделю с ${start.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} по ${end.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    } else {
      periodTitle = `За ${monthNames[selectedMonth]} ${selectedYear} года`;
    }

    let disciplineName = 'Все дисциплины';
    if (selectedDiscipline !== null) {
      const found = disciplines.find(d => d.id === selectedDiscipline);
      disciplineName = found ? found.name : 'Неизвестно';
    }

    const fontSize = filteredDates.length > 20 ? '6pt' : filteredDates.length > 15 ? '7pt' : '9pt';
    const headerFontSize = filteredDates.length > 20 ? '7pt' : filteredDates.length > 15 ? '8pt' : '10pt';
    const cellPadding = filteredDates.length > 20 ? '2px' : '4px';

    let tableRows = '';
    let totals: { [key: string]: { total: number; present: number; absent: number; respected: number; notRespected: number } } = {};

    students.forEach((student, index) => {
      let total = 0;
      let present = 0;
      let absent = 0;
      let respected = 0;
      let notRespected = 0;

      let row = `<tr>
        <td style="border:1px solid #000;padding:${cellPadding};text-align:center;font-size:${fontSize};">${index + 1}</td>
        <td style="border:1px solid #000;padding:${cellPadding};font-size:${fontSize};">${student.fullName}</td>`;

      filteredDates.forEach((date) => {
        const dateStr = date.toISOString().split('T')[0];
        const disciplineId = selectedDiscipline || (disciplines.length > 0 ? disciplines[0].id : 0);
        const status = getStudentAttendance(parseInt(student.id), disciplineId, dateStr);
        
        if (status === 'П') { total++; present++; respected++; }
        else if (status === 'Н') { total++; absent++; notRespected++; }
        
        row += `<td style="border:1px solid #000;padding:${cellPadding};text-align:center;font-size:${fontSize};">${status}</td>`;
      });

      row += `
        <td style="border:1px solid #000;padding:${cellPadding};text-align:center;font-size:${fontSize};">${total}</td>
        <td style="border:1px solid #000;padding:${cellPadding};text-align:center;font-size:${fontSize};">${respected}</td>
        <td style="border:1px solid #000;padding:${cellPadding};text-align:center;font-size:${fontSize};">${notRespected}</td>
      </tr>`;

      tableRows += row;

      totals[student.fullName] = { total, present, absent, respected, notRespected };
    });

    let totalAll = 0;
    let totalRespected = 0;
    let totalNotRespected = 0;

    Object.values(totals).forEach(t => {
      totalAll += t.total;
      totalRespected += t.respected;
      totalNotRespected += t.notRespected;
    });

    const totalStudents = students.length;
    const averageAttendance = totalStudents > 0 ? Math.round((totalAll / (totalStudents * filteredDates.length)) * 100) : 0;

    let dateHeaders = '';
    filteredDates.forEach((date) => {
      const dayName = weekDays[date.getDay() === 0 ? 6 : date.getDay() - 1];
      dateHeaders += `<th style="border:1px solid #000;padding:${cellPadding};text-align:center;font-size:${headerFontSize};">
        ${dayName}<br>${date.getDate()}.${date.getMonth() + 1}
      </th>`;
    });

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>Отчет по посещаемости</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Times New Roman', Times, serif; margin: 0.3cm; }
          @page { 
            size: ${pageOrientation}; 
            margin: 0.3cm;
          }
          h1 { text-align: center; font-size: ${isLandscape ? '14pt' : '18pt'}; margin-bottom: 5px; }
          .subtitle { text-align: center; font-size: ${isLandscape ? '9pt' : '12pt'}; margin-bottom: 8px; color: #555; }
          table { border-collapse: collapse; width: 100%; font-size: ${fontSize}; }
          th { background: #e8f0fe; font-weight: bold; font-size: ${headerFontSize}; }
          .total-row { background: #f0f0f0; font-weight: bold; }
          .total-label { font-weight: bold; }
          .footer-text { text-align: center; margin-top: 8px; font-size: 7pt; color: #888; }
          p { font-size: ${isLandscape ? '8pt' : '11pt'}; margin: 2px 0; }
        </style>
      </head>
      <body>
        <h1>ОТЧЕТ ПО ПОСЕЩАЕМОСТИ</h1>
        <p class="subtitle">Группа: ${group?.name || 'Не выбрана'} | ${periodTitle}</p>
        <p><strong>Дисциплина:</strong> ${disciplineName}</p>
        <p><strong>Всего студентов:</strong> ${students.length}</p>
        <br>
        
        <table>
          <thead>
            <tr>
              <th style="border:1px solid #000;padding:${cellPadding};text-align:center;width:25px;font-size:${headerFontSize};">№</th>
              <th style="border:1px solid #000;padding:${cellPadding};text-align:left;font-size:${headerFontSize};">ФИО студента</th>
              ${dateHeaders}
              <th style="border:1px solid #000;padding:${cellPadding};text-align:center;font-size:${headerFontSize};">Всего</th>
              <th style="border:1px solid #000;padding:${cellPadding};text-align:center;font-size:${headerFontSize};">Уваж.</th>
              <th style="border:1px solid #000;padding:${cellPadding};text-align:center;font-size:${headerFontSize};">Неуваж.</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="2" style="border:1px solid #000;padding:${cellPadding};text-align:right;font-size:${fontSize};">ИТОГО:</td>
              <td style="border:1px solid #000;padding:${cellPadding};text-align:center;font-size:${fontSize};">${totalAll}</td>
              <td style="border:1px solid #000;padding:${cellPadding};text-align:center;font-size:${fontSize};">${totalRespected}</td>
              <td style="border:1px solid #000;padding:${cellPadding};text-align:center;font-size:${fontSize};">${totalNotRespected}</td>
            </tr>
            <tr>
              <td colspan="2" style="border:1px solid #000;padding:${cellPadding};text-align:right;font-size:${fontSize};">Средняя посещаемость:</td>
              <td colspan="3" style="border:1px solid #000;padding:${cellPadding};text-align:center;font-weight:bold;font-size:${fontSize};">${averageAttendance}%</td>
            </tr>
          </tfoot>
        </table>
        
        <p class="footer-text">Отчет сформирован: ${new Date().toLocaleString('ru-RU')}</p>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Отчет_по_посещаемости_${group?.name || 'группа'}_${new Date().toISOString().split('T')[0]}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const saveReport = () => {
    alert('Отчет сохранен!');
  };

  const currentDates = getCurrentDates();

  if (loading) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

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

      <div className={styles.fadeInUp}>
        <main className={styles.mainContainer}>
          <header className={styles.header}>
            <div className={styles.headerTop}>
              <div className={styles.headerLogo}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <polyline points="9 12 11 14 15 10"/>
                </svg>
                <span className={styles.logoText}>ГБПОУ КК УСПК</span>
              </div>
              <div className={styles.headerCenter}>
                <Logo />
                <h1 className={styles.headerTitle}>Электронный табель посещаемости</h1>
              </div>
              <div className={styles.headerUser}>
                <button 
                  className={styles.userAvatar} 
                  onClick={() => setShowProfile(true)}
                  style={{ background: selectedColor }}
                >
                  {user?.fullName?.charAt(0) || 'П'}
                </button>
                <button className={styles.logoutBtn} onClick={handleLogout}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  Выйти
                </button>
              </div>
            </div>
          </header>

          <div className={styles.backWrapper}>
            <button className={styles.backBtn} onClick={handleGoBack}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
              Перейти к группам
            </button>
          </div>

          <div className={styles.pollBlock}>
            <div className={styles.pollHeader}>
              <div className={styles.pollTitle}>
                <div className={styles.pollLine}></div>
                <h3>Начать опрос присутствия</h3>
              </div>
            </div>
            <div className={styles.pollContent}>
              <div className={styles.pollRow}>
                <div className={styles.pollGroup}>
                  <label>Дисциплина</label>
                  <select 
                    className={styles.pollSelect}
                    value={pollDiscipline || ''}
                    onChange={(e) => setPollDiscipline(parseInt(e.target.value))}
                    disabled={isPollActive}
                  >
                    {disciplines.map(disc => (
                      <option key={disc.id} value={disc.id}>{disc.name}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.pollGroup}>
                  <label>Время (мин)</label>
                  <div className={styles.pollTimeSelector}>
                    <button 
                      className={styles.pollTimeBtn}
                      onClick={() => setPollMinutes(Math.max(10, pollMinutes - 5))}
                      disabled={isPollActive}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                    </button>
                    <span className={styles.pollTimeValue}>{pollMinutes}</span>
                    <button 
                      className={styles.pollTimeBtn}
                      onClick={() => setPollMinutes(Math.min(25, pollMinutes + 5))}
                      disabled={isPollActive}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                    </button>
                  </div>
                </div>
                <div className={styles.pollGroup}>
                  <label>Группа</label>
                  <div className={styles.pollGroupDisplay}>{group?.name || 'Не выбрана'}</div>
                </div>
              </div>

              <div className={styles.pollActions}>
                {isPollActive ? (
                  <div className={styles.pollActive}>
                    <span className={styles.pollActiveIcon}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                      </svg>
                    </span>
                    <span>
                      Опрос идёт! Осталось {pollTimeLeft} мин {pollSecondsLeft} сек
                    </span>
                    <span className={styles.pollActiveDiscipline}>
                      {(() => {
                        const activePoll = polls.find(p => p.active && p.groupId === parseInt(groupId || '0'));
                        if (!activePoll) return 'Неизвестно';
                        if (activePoll.disciplineName && activePoll.disciplineName !== 'Неизвестно' && activePoll.disciplineName !== '') {
                          return activePoll.disciplineName;
                        }
                        return getDisciplineName(activePoll.disciplineId);
                      })()}
                    </span>
                  </div>
                ) : (
                  <button className={styles.pollStartBtn} onClick={startPoll}>
                    Начать опрос
                  </button>
                )}
              </div>

              {isPollActive && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  marginTop: '8px'
                }}>
                  <button 
                    onClick={() => {
                      const activePoll = polls.find(p => p.active && p.groupId === parseInt(groupId || '0'));
                      if (activePoll) showCancelConfirmation(activePoll);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 20px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontFamily: 'Nunito, sans-serif',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                    Отменить опрос
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className={styles.contentWrapper}>
            <aside className={styles.sidebar}>
              <div className={styles.groupInfo}>
                <h3>Группа {group?.name}</h3>
                <p>Студентов: {students.length}</p>
                <p>Дисциплин: {disciplines.length}</p>
              </div>

              <div className={styles.filters}>
                <div className={styles.filterGroup}>
                  <label>Период</label>
                  <div className={styles.viewToggle}>
                    <button 
                      className={`${styles.viewBtn} ${viewMode === 'day' ? styles.active : ''}`}
                      onClick={() => setViewMode('day')}
                    >
                      День
                    </button>
                    <button 
                      className={`${styles.viewBtn} ${viewMode === 'week' ? styles.active : ''}`}
                      onClick={() => setViewMode('week')}
                    >
                      Неделя
                    </button>
                    <button 
                      className={`${styles.viewBtn} ${viewMode === 'month' ? styles.active : ''}`}
                      onClick={() => setViewMode('month')}
                    >
                      Месяц
                    </button>
                  </div>
                </div>

                <div className={styles.filterGroup}>
                  <label>Выбранный период</label>
                  <div className={styles.periodDisplay}>
                    {viewMode === 'day' && (
                      <input 
                        type="date" 
                        className={styles.dateInput}
                        value={currentDate.toISOString().split('T')[0]}
                        onChange={(e) => {
                          const newDate = new Date(e.target.value);
                          if (!isNaN(newDate.getTime())) {
                            setCurrentDate(newDate);
                          }
                        }}
                      />
                    )}
                    {viewMode === 'week' && (
                      <div className={styles.weekSelector}>
                        <button 
                          className={styles.weekNavBtn}
                          onClick={() => handleWeekChange(-1)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6"></polyline>
                          </svg>
                        </button>
                        <span className={styles.weekRange}>{formatWeekRange()}</span>
                        <button 
                          className={styles.weekNavBtn}
                          onClick={() => handleWeekChange(1)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6"></polyline>
                          </svg>
                        </button>
                      </div>
                    )}
                    {viewMode === 'month' && (
                      <div className={styles.monthSelector}>
                        <button 
                          className={styles.monthNavBtn}
                          onClick={() => handleMonthChange(-1)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6"></polyline>
                          </svg>
                        </button>
                        <span className={styles.monthDisplay}>
                          {monthNames[selectedMonth]} {selectedYear}
                        </span>
                        <button 
                          className={styles.monthNavBtn}
                          onClick={() => handleMonthChange(1)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6"></polyline>
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.filterGroup}>
                  <label>Дисциплина</label>
                  <div className={styles.disciplineList}>
                    {disciplines.map(disc => (
                      <button
                        key={disc.id}
                        className={`${styles.disciplineBtn} ${selectedDiscipline === disc.id ? styles.active : ''}`}
                        onClick={() => setSelectedDiscipline(disc.id)}
                      >
                        {disc.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            <section className={styles.tableSection}>
              <div className={styles.tableHeader}>
                <div className={styles.tableTitle}>
                  <div className={styles.titleLine}></div>
                  <h2>Контроль посещаемости</h2>
                </div>
                <div className={styles.tableActions}>
                  <button className={styles.reportBtn} onClick={saveReport}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                      <polyline points="17 21 17 13 7 13 7 21"/>
                      <polyline points="7 3 7 8 15 8"/>
                    </svg>
                    Сохранить отчет
                  </button>
                  <button className={styles.downloadBtn} onClick={downloadReport}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Скачать отчет
                  </button>
                </div>
              </div>

              {/* ОБЕРТКА ТАБЛИЦЫ С ОГРАНИЧЕНИЕМ ВЫСОТЫ И СКРОЛЛОМ */}
              <div className={styles.tableScrollContainer}>
                <div className={styles.tableWrapper}>
                  <table className={styles.attendanceTable}>
                    <thead>
                      <tr>
                        <th className={styles.stickyCol}>№</th>
                        <th className={styles.stickyColName}>ФИО студента</th>
                        {currentDates.map((date, i) => (
                          <th key={i}>
                            {viewMode === 'day' ? (
                              <>
                                {weekDays[date.getDay() === 0 ? 6 : date.getDay() - 1]}<br />
                                <span className={styles.dateSmall}>
                                  {date.getDate()}.{date.getMonth() + 1}
                                </span>
                              </>
                            ) : (
                              <>
                                {weekDays[date.getDay() === 0 ? 6 : date.getDay() - 1]}<br />
                                <span className={styles.dateSmall}>
                                  {date.getDate()}.{date.getMonth() + 1}
                                </span>
                              </>
                            )}
                          </th>
                        ))}
                        <th>Всего</th>
                        <th>Уваж.</th>
                        <th>Неуваж.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student, index) => {
                        let total = 0;
                        let respected = 0;
                        let notRespected = 0;

                        return (
                          <tr key={student.id}>
                            <td className={styles.stickyCol} style={{ textAlign: 'center' }}>{index + 1}</td>
                            <td className={styles.stickyColName}>{student.fullName}</td>
                            {currentDates.map((date, i) => {
                              const dateStr = date.toISOString().split('T')[0];
                              const disciplineId = selectedDiscipline || (disciplines.length > 0 ? disciplines[0].id : 0);
                              const status = getStudentAttendance(parseInt(student.id), disciplineId, dateStr);
                              
                              if (status === 'П') { total++; respected++; }
                              else if (status === 'Н') { total++; notRespected++; }
                              
                              return (
                                <td key={i} style={{ textAlign: 'center' }}>
                                  <select 
                                    className={`${styles.statusSelect} ${status === 'П' ? styles.present : status === 'Н' ? styles.absent : ''}`}
                                    value={status}
                                    onChange={(e) => {
                                      const newStatus = e.target.value;
                                      updateAttendance(
                                        parseInt(student.id),
                                        disciplineId,
                                        dateStr,
                                        newStatus
                                      );
                                    }}
                                  >
                                    <option value="-">-</option>
                                    <option value="П">П</option>
                                    <option value="Н">Н</option>
                                    <option value="Б">Б</option>
                                  </select>
                                </td>
                              );
                            })}
                            <td style={{ textAlign: 'center' }}>{total}</td>
                            <td style={{ textAlign: 'center' }}>
                              <span className={styles.respectedBadge}>{respected}</span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span className={styles.notRespectedBadge}>{notRespected}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>

      <Modal isOpen={showConfirmModal} onClose={cancelCancelPoll} title="Подтверждение">
        <div className={styles.confirmModalContent}>
          <p className={styles.confirmText}>
            Вы уверены, что хотите отменить опрос по "{pendingCancelPoll ? 
              (pendingCancelPoll.disciplineName && pendingCancelPoll.disciplineName !== 'Неизвестно' && pendingCancelPoll.disciplineName !== ''
                ? pendingCancelPoll.disciplineName 
                : getDisciplineName(pendingCancelPoll.disciplineId)) 
              : 'Неизвестно'}"?
          </p>
          <div className={styles.confirmButtons}>
            <button 
              className={styles.confirmCancelBtn}
              onClick={cancelCancelPoll}
            >
              Отмена
            </button>
            <button 
              className={styles.confirmDeleteBtn}
              onClick={confirmCancelPoll}
            >
              Да, отменить
            </button>
          </div>
        </div>
      </Modal>

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