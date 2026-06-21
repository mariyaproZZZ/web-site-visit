import React from 'react';
import styles from './Footer.module.scss';

interface FooterLink {
  label: string;
  onClick: () => void;
}

interface FooterProps {
  links: FooterLink[];
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ links, className = '' }) => {
  return (
    <div className={`${styles.footer} ${className}`}>
      {links.map((link, index) => (
        <div key={index} className={styles.footerLink} onClick={link.onClick}>
          {link.label}
        </div>
      ))}
    </div>
  );
};