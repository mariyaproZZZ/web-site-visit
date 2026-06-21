import React from 'react';
import styles from './Modal.module.scss';
import { Button } from '../button/Button';

interface ModalProps {
  isOpen: boolean;
  content: string;
  onClose: () => void;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  content,
  onClose,
  className = ''
}) => {
  if (!isOpen) return null;
  
  return (
    <div className={`${styles.modal} ${className}`}>
      <p style={{ textAlign: 'center', margin: 0 }}>{content}</p>
      <Button variant="close" onClick={onClose}>Закрыть</Button>
    </div>
  );
};