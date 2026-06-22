import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../utils/auth';
import styles from './mainTeacher.module.scss';

export const MainTeacher: React.FC = () => {
  const navigate = useNavigate();
  const [selectedGroup, setSelectedGroup] = useState('ИС-21');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const groups = ['ИС-21', 'ИС-22', 'ИС-23', 'БА-21'];

  return (
    <div className={styles.teacherContainer}>
      <div className={styles.header}>
        <h1 className={styles.welcomeTitle}>Личный кабинет преподавателя</h1>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          Выйти
        </button>
      </div>

      <div className={styles.content}>
        {/* Информация о преподавателе */}
        <div className={styles.infoCard}>
          <h3>Информация о преподавателе</h3>
          <p><strong>ФИО:</strong> Скляров Михаил Александрович</p>
          <p><strong>Кафедра:</strong> Информационных технологий</p>
          <p><strong>Должность:</strong> Доцент</p>
        </div>

        {/* Выбор группы */}
        <div className={styles.groupSelector}>
          <label>Выберите группу:</label>
          <select 
            value={selectedGroup} 
            onChange={(e) => setSelectedGroup(e.target.value)}
            className={styles.select}
          >
            {groups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </div>

        {/* Табель посещаемости группы */}
        <div className={styles.tableWrapper}>
          <h3>Табель посещаемости группы {selectedGroup}</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>№</th>
                <th>Студент</th>
                <th>Всего занятий</th>
                <th>Посещено</th>
                <th>Пропущено</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>Иванов Иван</td>
                <td>20</td>
                <td>18</td>
                <td>2</td>
                <td>90%</td>
              </tr>
              <tr>
                <td>2</td>
                <td>Петров Петр</td>
                <td>20</td>
                <td>15</td>
                <td>5</td>
                <td>75%</td>
              </tr>
              <tr>
                <td>3</td>
                <td>Сидорова Мария</td>
                <td>20</td>
                <td>20</td>
                <td>0</td>
                <td>100%</td>
              </tr>
              <tr>
                <td>4</td>
                <td>Козлов Дмитрий</td>
                <td>20</td>
                <td>12</td>
                <td>8</td>
                <td>60%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};