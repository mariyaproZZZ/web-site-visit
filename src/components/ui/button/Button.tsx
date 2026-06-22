import React from 'react';
import styles from './Button.module.scss';

interface ButtonProps {
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'close';
  disabled?: boolean; // ← добавили
}

export const Button: React.FC<ButtonProps> = ({
  children,
  type = 'button',
  onClick,
  className = '',
  variant = 'primary',
  disabled = false, // ← добавили
}) => {
  const buttonClass = `${styles.button} ${styles[variant]} ${className}`;
  
  return (
    <button
      type={type}
      className={buttonClass}
      onClick={onClick}
      disabled={disabled} // ← добавили
    >
      {children}
    </button>
  );
};