import React from 'react';
import styles from './Logo.module.scss';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = '' }) => {
  return (
    <div className={`${styles.logoWrapper} ${className}`}>
      <svg className={styles.logo} viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8DEBFF"/>
            <stop offset="100%" stopColor="#0A84FF"/>
          </linearGradient>
          <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3DE6FF"/>
            <stop offset="100%" stopColor="#7CFF3D"/>
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <path
          d="M170 420 C110 350 120 270 210 240 C320 200 540 180 670 240 C760 280 740 390 620 450"
          fill="none"
          stroke="url(#greenGrad)"
          strokeWidth="28"
          strokeLinecap="round"
          filter="url(#glow)"
          opacity="0.9"/>

        <circle cx="300" cy="170" r="75" fill="url(#blueGrad)" stroke="#0A84FF" strokeWidth="6"/>
        
        <path
          d="M185 360 C185 280 245 245 300 245 C355 245 415 280 415 360 L415 405 L185 405 Z"
          fill="url(#blueGrad)"
          stroke="#0A84FF"
          strokeWidth="6"/>

        <ellipse cx="300" cy="425" rx="145" ry="28" fill="url(#greenGrad)" opacity="0.6"/>

        <g transform="translate(430,210) rotate(6)">
          <rect x="0" y="0" width="220" height="260" rx="20" fill="#F5FCFF" stroke="#0A84FF" strokeWidth="6"/>
          <line x1="25" y1="65" x2="95" y2="65" stroke="#0A84FF" strokeWidth="10" strokeLinecap="round"/>
          <line x1="25" y1="125" x2="95" y2="125" stroke="#0A84FF" strokeWidth="10" strokeLinecap="round"/>
          <line x1="25" y1="185" x2="95" y2="185" stroke="#0A84FF" strokeWidth="10" strokeLinecap="round"/>
          <path d="M145 60 L160 75 L190 40" fill="none" stroke="#35C84A" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M145 120 L160 135 L190 100" fill="none" stroke="#35C84A" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="125" y1="185" x2="185" y2="185" stroke="#0A84FF" strokeWidth="10" strokeLinecap="round"/>
        </g>
      </svg>
    </div>
  );
};