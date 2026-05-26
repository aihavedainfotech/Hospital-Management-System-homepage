import { useEffect, useState } from 'react';
import facilityImg from '../assets/hospital_facility.png';
import { fetchServices, Service } from '../api';

export default function AboutSection() {
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    fetchServices().then(setServices);
  }, []);

  return (
    <section id="about" style={{ padding: '6rem 0', background: 'var(--bg-secondary)' }}>
      <div className="container">
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          
          <div style={{ width: '100%', overflow: 'hidden' }}>
            <span style={{
              color: 'var(--blue-primary)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontSize: '0.85rem',
              display: 'block',
              marginBottom: '1rem'
            }}>Our Services</span>
            
            <h2 style={{
              fontFamily: 'Poppins, sans-serif',
              fontSize: '2.5rem',
              color: 'var(--text-primary)',
              lineHeight: 1.2,
              marginBottom: '2rem'
            }}>
              Comprehensive <br/><span style={{ color: 'var(--blue-primary)' }}>Medical Care</span>
            </h2>
            
            <div className="services-marquee-container" style={{ overflow: 'hidden', position: 'relative', width: '100%', padding: '1rem 0' }}>
              <div className="services-marquee-inner" style={{ display: 'inline-flex', gap: '1.5rem', animation: 'servicesScroll 25s linear infinite' }}>
                {/* Duplicate list for seamless scrolling */}
                {[...services, ...services].map((s, idx) => (
                  <div key={`${s.id}-${idx}`} style={{
                    width: '140px',
                    height: '140px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem',
                    background: 'white',
                    borderRadius: '16px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                    textAlign: 'center',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(20,184,166,0.15)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.05)'; }}
                  >
                    <div style={{
                      width: '50px', height: '50px', borderRadius: '50%',
                      background: '#F8FFFE', color: 'var(--blue-primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.5rem', marginBottom: '12px'
                    }}>
                      <i className={s.icon || 'fas fa-stethoscope'}></i>
                    </div>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-dark)', fontWeight: 600 }}>{s.title}</h4>
                  </div>
                ))}
              </div>
            </div>
            
            <style>{`
              @keyframes servicesScroll {
                0% { transform: translateX(0); }
                100% { transform: translateX(calc(-50% - 0.75rem)); }
              }
              .services-marquee-inner:hover {
                animation-play-state: paused;
              }
            `}</style>

          </div>
        </div>
      </div>
    </section>
  );
}
