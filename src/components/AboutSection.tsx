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
            
            <div className="services-marquee-container" style={{ overflow: 'hidden', position: 'relative', width: '100%', padding: '1rem 0', minHeight: '270px' }}>
              <div className="services-marquee-inner" style={{ display: 'inline-flex', gap: '1.5rem', animation: 'servicesScroll 20s linear infinite' }}>
                {services.length === 0 ? (
                  Array.from({ length: 6 }).map((_, idx) => (
                    <div key={`skel-${idx}`} className="skeleton" style={{ width: '280px', height: '230px', borderRadius: '20px' }}></div>
                  ))
                ) : (
                  [...services, ...services].map((s, idx) => (
                  <div key={`${s.id}-${idx}`} style={{
                    width: '280px',
                    height: '230px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1.5rem',
                    background: 'white',
                    borderRadius: '20px',
                    border: '1px solid rgba(15, 45, 82, 0.12)',
                    boxShadow: '0 10px 30px rgba(15, 45, 82, 0.1)',
                    textAlign: 'center',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
                    boxSizing: 'border-box',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(20, 184, 166, 0.22)'; e.currentTarget.style.borderColor = 'rgba(20, 184, 166, 0.3)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(15, 45, 82, 0.1)'; e.currentTarget.style.borderColor = 'rgba(15, 45, 82, 0.12)'; }}
                  >
                    <div style={{
                      width: '56px', height: '56px', borderRadius: '50%',
                      background: '#F8FFFE', color: 'var(--blue-primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.6rem', marginBottom: '14px',
                      flexShrink: 0
                    }}>
                      <i className={s.icon || 'fas fa-stethoscope'}></i>
                    </div>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', color: 'var(--text-dark)', fontWeight: 600 }}>{s.title}</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B', lineHeight: '1.5', fontWeight: 400 }}>{s.description}</p>
                  </div>
                )))}
              </div>
            </div>
            
            <style>{`
              @keyframes servicesScroll {
                0% { transform: translateX(0); }
                100% { transform: translateX(calc(-50% - 0.75rem)); }
              }
              .services-marquee-inner {
                animation: servicesScroll 20s linear infinite;
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
