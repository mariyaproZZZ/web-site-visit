import React from 'react';
import styles from './Title.module.scss';

interface TitleProps {
  children: React.ReactNode;
  level?: 1 | 2 | 3;
  className?: string;
}

export const Title: React.FC<TitleProps> = ({
  children,
  level = 1,
  className = ''
}) => {
  const titleClass = `${styles.title} ${styles[`level${level}`]} ${className}`;
  
  // Используем switch для выбора правильного тега
  switch (level) {
    case 1:
      return <h1 className={titleClass}>{children}</h1>;
    case 2:
      return <h2 className={titleClass}>{children}</h2>;
    case 3:
      return <h3 className={titleClass}>{children}</h3>;
    default:
      return <h1 className={titleClass}>{children}</h1>;
  }
};