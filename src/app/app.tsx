import React from 'react';
import { AppRouter } from '../router/router';
import styles from './app.module.scss';

export const App: React.FC = () => {
  return (
    <div className={styles.appContainer}>
      <AppRouter />
    </div>
  );
};