import { useState } from 'react';

export default function AmbulanceService() {
  const [showModal, setShowModal] = useState(false);

  return (
    <section id="ambulance" style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      padding: '3rem 0',
      background: '#FFFFFF',
      position: 'relative', overflow: 'hidden',
      borderTop: '1px solid #E6EEF5'
    }}>
      <style>{`
        .amb-dot-grid {
          position: absolute; inset: 0; pointer-events: none;
          background-image: radial-gradient(rgba(46,163,242,0.05) 1px, transparent 1px);
          background-size: 28px 28px;
        }
        @keyframes ambPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4), 0 8px 30px rgba(239,68,68,0.2); transform: scale(1); }
          50%      { box-shadow: 0 0 0 15px rgba(239,68,68,0), 0 8px 30px rgba(239,68,68,0.2); transform: scale(1.05); }
        }
        .amb-btn {
          background: linear-gradient(135deg, #EF4444, #F87171);
          color: white; border: none; border-radius: 50%;
          width: 80px; height: 80px; font-size: 2rem; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 1rem;
          animation: ambPulse 2s ease-in-out infinite;
          border: 3px solid #FFFFFF;
          box-shadow: 0 10px 25px rgba(239,68,68,0.3);
          transition: transform 0.2s ease;
        }
        .amb-btn:hover { transform: scale(1.1) !important; }
        .amb-card {
          background: #FFFFFF;
          border-radius: 20px; padding: 2.5rem;
          width: 100%; max-width: 700px; max-height: 90vh;
          overflow-y: auto; position: relative;
          border: 1px solid #E6EEF5;
          box-shadow: 0 20px 50px rgba(31, 45, 61, 0.1);
        }
        .amb-close-btn {
          position: absolute; top: 1.25rem; right: 1.25rem;
          background: #F7FBFF; border: 1px solid #E6EEF5;
          border-radius: 8px; width: 36px; height: 36px; font-size: 1rem;
          cursor: pointer; color: #6B7C93;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s ease;
        }
        .amb-close-btn:hover { background: #EAF4FF; color: #2EA3F2; }
        .amb-call-banner {
          background: linear-gradient(135deg, #EF4444 0%, #F87171 100%);
          border-radius: 16px; padding: 1.75rem; margin-bottom: 1.5rem;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 1.25rem;
          box-shadow: 0 8px 25px rgba(239,68,68,0.2);
          position: relative; overflow: hidden;
        }
        .amb-info-box {
          background: #F7FBFF;
          border-radius: 12px; padding: 1.25rem;
          display: flex; align-items: center; gap: 1rem;
          border: 1px solid #E6EEF5;
        }
        @keyframes ambModalIn {
          from { opacity: 0; transform: scale(0.98) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .amb-modal-anim { animation: ambModalIn 0.3s ease-out; }
      `}</style>

      <div className="amb-dot-grid" />

      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <button className="amb-btn" onClick={() => setShowModal(true)}>
          <i className="fas fa-ambulance" />
        </button>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1F2D3D', marginBottom: '0.25rem' }}>
          Ambulance Services
        </h3>
        <p style={{ fontSize: '0.85rem', color: '#6B7C93' }}>Emergency Support 24/7</p>
      </div>

      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(31,45,61,0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '1rem',
          }}
        >
          <div className="amb-card amb-modal-anim" onClick={e => e.stopPropagation()}>
            <button className="amb-close-btn" onClick={() => setShowModal(false)}>
              <i className="fas fa-times" />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{
                width: '60px', height: '60px', borderRadius: '12px',
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem',
              }}>
                <i className="fas fa-ambulance" style={{ color: '#EF4444', fontSize: '1.5rem', margin: 'auto' }} />
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1F2D3D', marginBottom: '0.5rem' }}>
                Emergency Ambulance
              </h2>
              <p style={{ color: '#6B7C93', fontSize: '0.95rem', maxWidth: '500px', margin: '0 auto', lineHeight: 1.6 }}>
                Rapid medical response within minutes. Our advanced life support fleet is ready to assist you anytime.
              </p>
            </div>

            <div className="amb-call-banner">
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <div style={{ width: '8px', height: '8px', background: 'white', borderRadius: '50%', opacity: 0.8 }} />
                  <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                    24/7 Hotline
                  </span>
                </div>
                <p style={{ color: 'white', fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>
                  Immediate Response Team
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
                <a href="tel:999999999" style={{
                  background: 'white', color: '#EF4444', padding: '0.75rem 1.5rem', borderRadius: '8px',
                  fontWeight: 700, fontSize: '1.1rem', textDecoration: 'none',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}>
                  <i className="fas fa-phone-alt" /> 999999999
                </a>
              </div>
            </div>

            <div className="amb-info-box">
              <i className="fas fa-info-circle" style={{ color: '#2EA3F2', fontSize: '1.2rem', flexShrink: 0 }} />
              <p style={{ fontSize: '0.85rem', color: '#6B7C93', lineHeight: 1.6, margin: 0 }}>
                <strong style={{ color: '#1F2D3D' }}>Response Time: Under 10 minutes.</strong> Fully equipped with ICU facilities and expert medical staff to handle all emergencies.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
