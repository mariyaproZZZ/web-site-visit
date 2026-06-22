import React from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../utils/auth';
import styles from './mainStudent.module.scss';

export const MainStudent: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={styles.studentContainer}>
      <div className={styles.header}>
        <h1 className={styles.welcomeTitle}>Добро пожаловать в личный кабинет студента!</h1>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          Выйти
        </button>
      </div>

      <div className={styles.content}>
        {/* Информация о студенте */}
        <div className={styles.infoCard}>
          <h3>Информация о студенте</h3>
          <p><strong>ФИО:</strong> Иванов Иван Иванович</p>
          <p><strong>Группа:</strong> ИС-21</p>
          <p><strong>Курс:</strong> 3</p>
        </div>

        {/* Табель посещаемости */}
        <div className={styles.tableWrapper}>
          <h3>Табель посещаемости</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Предмет</th>
                <th>Всего занятий</th>
                <th>Посещено</th>
                <th>Пропущено</th>
                <th>% посещаемости</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Математика</td>
                <td>20</td>
                <td>18</td>
                <td>2</td>
                <td>90%</td>
              </tr>
              <tr>
                <td>Физика</td>
                <td>16</td>
                <td>14</td>
                <td>2</td>
                <td>87.5%</td>
              </tr>
              <tr>
                <td>Программирование</td>
                <td>24</td>
                <td>23</td>
                <td>1</td>
                <td>95.8%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};