import React from 'react';

interface HospitalLogoProps {
  size?: number;
  className?: string;
  animated?: boolean;
  variant?: 'light' | 'dark';
}

/**
 * Haveda Hospital — Clean minimal logo
 * Circle + serif H, no stethoscope, no rings
 * Teal/navy palette, subtle pulse on H
 */
const HospitalLogo: React.FC<HospitalLogoProps> = ({
  size = 56,
  className = '',
  animated = true,
  variant = 'light',
}) => {
  const uid = React.useId().replace(/:/g, '');

  // On dark bg (intro/hero): white circle, white H
  // On light bg (navbar): teal circle, teal H
  const stroke  = variant === 'light' ? '#ffffff' : '#1a7a7a';
  const fill    = variant === 'light' ? '#ffffff' : '#1a7a7a';
  const opacity = variant === 'light' ? 0.9 : 1;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`hlogo ${animated ? 'hlogo--anim' : ''} ${className}`}
      aria-label="Haveda Hospital"
      style={{ overflow: 'visible', display: 'block' }}
    >
      <defs>
        <filter id={`glow-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.5" result="b"/>
          <feMerge>
            <feMergeNode in="b"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* ── Circle ── */}
      <circle
        cx="50" cy="50" r="44"
        stroke={stroke}
        strokeWidth="3.5"
        opacity={opacity}
        className={animated ? 'hlogo-circle' : ''}
        filter={`url(#glow-${uid})`}
      />

      {/* ── H — using text for crisp, proper typography ── */}
      <text
        x="50"
        y="68"
        textAnchor="middle"
        fontFamily="'Playfair Display', 'Georgia', serif"
        fontSize="52"
        fontWeight="700"
        fill={fill}
        opacity={opacity}
        className={animated ? 'hlogo-h' : ''}
        filter={`url(#glow-${uid})`}
        style={{ letterSpacing: '-1px' }}
      >
        H
      </text>

      <style>{`
        /* Entry fade + scale */
        .hlogo--anim {
          opacity: 0;
          transform: scale(0.88);
          animation: hlogoIn 0.7s cubic-bezier(0.34, 1.4, 0.64, 1) forwards;
        }
        @keyframes hlogoIn {
          to { opacity: 1; transform: scale(1); }
        }

        /* Circle stroke draw */
        .hlogo--anim .hlogo-circle {
          stroke-dasharray: 280;
          stroke-dashoffset: 280;
          animation: hlogoDraw 1.2s ease forwards 0.3s;
        }
        @keyframes hlogoDraw {
          to { stroke-dashoffset: 0; }
        }

        /* H fades in after circle */
        .hlogo--anim .hlogo-h {
          opacity: 0;
          animation: hlogoFade 0.6s ease forwards 1.2s;
        }
        @keyframes hlogoFade {
          to { opacity: ${opacity}; }
        }

        /* Subtle heartbeat on H */
        .hlogo--anim .hlogo-h {
          animation:
            hlogoFade 0.6s ease forwards 1.2s,
            hlogoBeat 2.4s ease-in-out infinite 2s;
        }
        @keyframes hlogoBeat {
          0%   { transform: scale(1);    transform-origin: 50px 50px; }
          14%  { transform: scale(1.06); transform-origin: 50px 50px; }
          28%  { transform: scale(1);    transform-origin: 50px 50px; }
          40%  { transform: scale(1.04); transform-origin: 50px 50px; }
          55%  { transform: scale(1);    transform-origin: 50px 50px; }
          100% { transform: scale(1);    transform-origin: 50px 50px; }
        }

        /* Hover */
        .hlogo:hover {
          filter: drop-shadow(0 0 8px rgba(255,255,255,0.5));
          transform: scale(1.06);
          transition: filter 0.3s, transform 0.3s;
          cursor: pointer;
        }
      `}</style>
    </svg>
  );
};

export default HospitalLogo;
