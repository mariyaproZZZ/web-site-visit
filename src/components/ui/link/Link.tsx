import React from 'react';
import styles from './Link.module.scss';

interface LinkProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  variant?: 'forgot' | 'footer';
}

export const Link: React.FC<LinkProps> = ({
  children,
  href = '#',
  onClick,
  className = '',
  variant = 'footer'
}) => {
  const linkClass = `${styles.link} ${styles[variant]} ${className}`;
  
  return (
    <a href={href} className={linkClass} onClick={onClick}>
      {children}
    </a>
  );
};