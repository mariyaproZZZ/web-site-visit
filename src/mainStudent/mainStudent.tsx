import React from 'react';
import styles from './mainStudent.module.scss';

export const MainStudent: React.FC = () => {
  return (
    <div className={styles.studentContainer}>
      <h1 className={styles.welcomeTitle}>Добро пожаловать в личный кабинет студента!</h1>
      <p className={styles.description}>Здесь будет отображаться ваш электронный табель.</p>
    </div>
  );
};