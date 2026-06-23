import React from 'react';
import styles from './Modal.module.scss';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  className = '',
  style = {}
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div 
        className={`${styles.modal} ${className}`} 
        style={style}
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h2 className={styles.modalTitle}>{title}</h2>}
        <button className={styles.closeBtn} onClick={onClose}>✕</button>
        <div className={styles.modalContent}>
          {children}
        </div>
      </div>
    </div>
  );
};