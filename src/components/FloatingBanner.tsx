import { useState } from 'react';

interface FloatingBannerProps {
  onBook: () => void;
  onFindDoctor: () => void;
  onCancel: () => void;
  onFeedback: () => void;
}

export default function FloatingBanner({ onBook, onFindDoctor, onCancel, onFeedback }: FloatingBannerProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const actions = [
    { label: 'Book Appointment', icon: 'fas fa-calendar-plus', color: '#0F766E', bg: 'linear-gradient(135deg,#14B8A6,#0F766E)', onClick: onBook },
    { label: 'Find Doctor',      icon: 'far fa-user',           color: '#2563EB', bg: 'linear-gradient(135deg,#3B82F6,#2563EB)', onClick: onFindDoctor },
    { label: 'Cancel/Reschedule',icon: 'far fa-file-alt',       color: '#B45309', bg: 'linear-gradient(135deg,#F59E0B,#B45309)', onClick: onCancel },
    { label: 'Feedback',         icon: 'far fa-star',           color: '#BE185D', bg: 'linear-gradient(135deg,#EC4899,#BE185D)', onClick: onFeedback },
  ];

  return (
    <>
      <style>{`
        /* ── Desktop sidebar ── */
        .fb-desktop {
          position: fixed;
          right: 20px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 9998;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .fb-desktop-btn {
          background: white;
          padding: 11px 18px;
          border-radius: 14px;
          box-shadow: 0 6px 20px rgba(0,0,0,0.08);
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.85rem;
          border: 1px solid #E2E8F0;
          transition: all 0.22s;
          white-space: nowrap;
          min-width: 180px;
          font-family: 'Poppins', sans-serif;
        }
        .fb-desktop-btn:hover {
          transform: translateX(-4px) scale(1.02);
          box-shadow: 0 10px 28px rgba(0,0,0,0.12);
          border-color: transparent;
        }
        .fb-desktop-icon {
          width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          color: white; font-size: 0.9rem;
        }

        /* ── Mobile bottom bar ── */
        .fb-mobile { display: none; }
        .fb-mobile-bar {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          z-index: 9998;
          background: rgba(255,255,255,0.97);
          backdrop-filter: blur(16px);
          border-top: 1px solid #E2E8F0;
          box-shadow: 0 -4px 24px rgba(15,45,82,0.1);
          padding: 8px 12px 10px;
          display: flex;
          justify-content: space-around;
          align-items: center;
          gap: 4px;
        }
        .fb-mobile-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 6px 2px;
          border-radius: 12px;
          cursor: pointer;
          border: none;
          background: transparent;
          transition: background 0.18s;
          font-family: 'Poppins', sans-serif;
        }
        .fb-mobile-item:active { background: #F1F5F9; }
        .fb-mobile-icon {
          width: 40px; height: 40px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1rem; color: white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.18);
          transition: transform 0.18s;
        }
        .fb-mobile-item:active .fb-mobile-icon { transform: scale(0.92); }
        .fb-mobile-label {
          font-size: 0.58rem;
          font-weight: 600;
          color: #475569;
          text-align: center;
          line-height: 1.2;
          max-width: 60px;
        }

        /* Show/hide based on screen */
        @media (max-width: 768px) {
          .fb-desktop { display: none !important; }
          .fb-mobile  { display: block !important; }
        }
        @media (min-width: 769px) {
          .fb-mobile { display: none !important; }
        }
      `}</style>

      {/* ── Desktop Sidebar ── */}
      <div className="fb-desktop">
        {actions.map((a, i) => (
          <div key={i} className="fb-desktop-btn" onClick={a.onClick}
            style={{ color: a.color }}
            onMouseEnter={e => (e.currentTarget.style.background = a.bg, e.currentTarget.style.color = 'white')}
            onMouseLeave={e => (e.currentTarget.style.background = 'white', e.currentTarget.style.color = a.color)}>
            <div className="fb-desktop-icon" style={{ background: a.bg }}>
              <i className={a.icon} />
            </div>
            {a.label}
          </div>
        ))}
      </div>

      {/* ── Mobile Bottom Bar ── */}
      <div className="fb-mobile">
        <div className="fb-mobile-bar">
          {actions.map((a, i) => (
            <button key={i} className="fb-mobile-item" onClick={a.onClick}>
              <div className="fb-mobile-icon" style={{ background: a.bg }}>
                <i className={a.icon} />
              </div>
              <span className="fb-mobile-label">
                {a.label === 'Book Appointment' ? 'Book' :
                 a.label === 'Find Doctor' ? 'Doctors' :
                 a.label === 'Cancel/Reschedule' ? 'Cancel' : 'Feedback'}
              </span>
            </button>
          ))}
        </div>
        {/* Spacer to push page content above bottom bar */}
        <div style={{ height: '72px' }} />
      </div>
    </>
  );
}
