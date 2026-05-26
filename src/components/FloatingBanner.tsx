import React from 'react';

interface FloatingBannerProps {
  onBook: () => void;
  onFindDoctor: () => void;
  onCancel: () => void;
  onFeedback: () => void;
}

export default function FloatingBanner({ onBook, onFindDoctor, onCancel, onFeedback }: FloatingBannerProps) {
  const btnStyle: React.CSSProperties = {
    background: 'white',
    padding: '14px 24px',
    borderRadius: '16px',
    boxShadow: '0 6px 20px rgba(0,0,0,0.06)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.95rem',
    border: '1px solid #E2E8F0',
    transition: 'all 0.2s',
    width: '100%'
  };

  return (
    <div style={{
      position: 'fixed',
      right: '20px',
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: 9998,
      display: 'flex',
      flexDirection: 'column',
      gap: '15px'
    }}>
      <style>{`
        .floating-btn:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 8px 25px rgba(0,0,0,0.1) !important;
        }
      `}</style>
      
      <div className="floating-btn" onClick={onBook} style={{ ...btnStyle, color: '#0F766E' }}>
        <i className="fas fa-calendar-plus" style={{ fontSize: '1.4rem' }}></i> Book Appointment
      </div>
      
      <div className="floating-btn" onClick={onFindDoctor} style={{ ...btnStyle, color: '#2563EB' }}>
        <i className="far fa-user" style={{ fontSize: '1.4rem' }}></i> Find Doctor
      </div>
      
      <div className="floating-btn" onClick={onCancel} style={{ ...btnStyle, color: '#B45309' }}>
        <i className="far fa-file-alt" style={{ fontSize: '1.4rem' }}></i> Cancel/Reschedule
      </div>
      
      <div className="floating-btn" onClick={onFeedback} style={{ ...btnStyle, color: '#BE185D' }}>
        <i className="far fa-star" style={{ fontSize: '1.4rem' }}></i> Feedback
      </div>
    </div>
  );
}
