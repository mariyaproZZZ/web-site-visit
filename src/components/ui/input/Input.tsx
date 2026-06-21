import React from 'react';
import styles from './Input.module.scss';

interface InputProps {
  type: 'text' | 'password' | 'email';
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
  label?: string;
  className?: string;
  name?: string;
}

export const Input: React.FC<InputProps> = ({
  type,
  placeholder,
  value,
  onChange,
  onFocus,
  label,
  className = '',
  name
}) => {
  return (
    <div className={styles.inputGroup}>
      {label && <label className={styles.inputLabel}>{label}</label>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        name={name}
        className={`${styles.input} ${className}`}
      />
    </div>
  );
};