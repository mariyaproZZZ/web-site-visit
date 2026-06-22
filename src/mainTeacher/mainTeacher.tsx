import React from 'react';
import styles from './mainTeacher.module.scss';

export const MainTeacher: React.FC = () => {
  return (
    <div className={styles.teacherContainer}>
      <h1 className={styles.welcomeTitle}>Добро пожаловать в личный кабинет преподавателя!</h1>
      <p className={styles.description}>Здесь вы сможете управлять электронным табелем посещаемости студентов.</p>
    </div>
  );
};