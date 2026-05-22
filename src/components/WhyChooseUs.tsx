import { useEffect, useRef } from 'react';

const reasons = [
  { icon: 'fas fa-user-md',    title: 'Expert Doctors',   desc: 'Highly qualified specialists with years of experience across all medical fields.', color: '#9B6BB4' },
  { icon: 'fas fa-microscope', title: 'Modern Technology', desc: 'State-of-the-art equipment for precise diagnostics and effective treatments.',       color: '#A8E6D5' },
  { icon: 'fas fa-heartbeat',  title: 'Patient-First Care',desc: 'Compassionate, patient-centered care focused on comfort and quick recovery.',        color: '#C9A8DC' },
  { icon: 'fas fa-ambulance',  title: '24/7 Emergency',    desc: 'Round-the-clock emergency and trauma support to handle critical situations.',        color: '#8FD9C4' },
];

const stats = [
  { value: '200+', label: 'Specialist Doctors' },
  { value: '30k+', label: 'Happy Patients' },
  { value: '24/7', label: 'Emergency Service' },
  { value: '50+',  label: 'Advanced ICU Beds' },
];

function AnimCard({ children, delay = 0, direction = 'up' }: { children: React.ReactNode; delay?: number; direction?: 'up' | 'left' | 'right' }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setTimeout(() => el.classList.add('visible'), delay); obs.unobserve(el); }
    }, { threshold: 0.1 });
    obs.observe(el); return () => obs.disconnect();
  }, [delay]);
  return <div ref={ref} className={`fade-in-${direction}`}>{children}</div>;
}

export default function WhyChooseUs() {
  return (
    <section className="section-pad" style={{
      background: '#EEF9F6',
      position: 'relative', overflow: 'hidden',
    }}>
      <style>{`
        .why-dot-grid {
          position: absolute; inset: 0; pointer-events: none;
          background-image: radial-gradient(rgba(155,107,180,0.07) 1px, transparent 1px);
          background-size: 28px 28px;
        }
        .why-blob-1 {
          position: absolute; top: -80px; right: -80px;
          width: 400px; height: 400px; border-radius: 50%;
          background: radial-gradient(circle, rgba(201,168,220,0.08) 0%, transparent 65%);
          pointer-events: none;
        }
        .why-blob-2 {
          position: absolute; bottom: -60px; left: -60px;
          width: 350px; height: 350px; border-radius: 50%;
          background: radial-gradient(circle, rgba(109,207,184,0.08) 0%, transparent 65%);
          pointer-events: none;
        }
        .why-stat-card {
          border-radius: 20px; padding: 1.5rem; text-align: center;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .why-stat-card:hover { transform: translateY(-6px); }
        .why-reason-card {
          background: rgba(250,248,243,0.85);
          backdrop-filter: blur(12px);
          border-radius: 20px; padding: 2rem;
          border: 1px solid rgba(168,230,213,0.20);
          box-shadow: 0 4px 20px rgba(155,107,180,0.08), inset 0 1px 0 rgba(255,255,255,0.7);
          transition: all 0.3s ease; text-align: center; height: 100%;
        }
        .why-reason-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 16px 40px rgba(155,107,180,0.14), inset 0 1px 0 rgba(255,255,255,0.8);
          border-color: rgba(168,230,213,0.35);
        }
      `}</style>

      <div className="why-dot-grid" />
      <div className="why-blob-1" />
      <div className="why-blob-2" />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <AnimCard direction="up">
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: 'rgba(155,107,180,0.10)', border: '1px solid rgba(155,107,180,0.25)',
              borderRadius: '30px', padding: '0.4rem 1.1rem', marginBottom: '1.25rem',
            }}>
              <i className="fas fa-award" style={{ color: '#9B6BB4', fontSize: '0.875rem' }} />
              <span style={{ color: '#9B6BB4', fontSize: '0.875rem', fontWeight: 600 }}>Why Choose Haveda</span>
            </div>
            <h2 style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
              fontWeight: 800, color: '#4A3F5E', lineHeight: 1.2, marginBottom: '1.25rem',
            }}>
              Committed to Your Health,{' '}
              <span style={{
                background: 'linear-gradient(135deg, #9B6BB4, #A8E6D5)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>Every Step</span> of the Way
            </h2>
            <p style={{ color: '#6B7A6C', lineHeight: 1.8, fontSize: '1rem', maxWidth: '680px', margin: '0 auto 1.5rem' }}>
              At Haveda Hospital, we combine cutting-edge medical technology with compassionate, patient-centered care. Our team of 200+ specialist doctors work together to provide personalized treatment plans.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {[
                { icon: 'fas fa-certificate', label: 'NABH Accredited 2025' },
                { icon: 'fas fa-trophy',      label: 'Best Hospital 2025' },
              ].map((b, i) => (
                <div key={i} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  background: 'rgba(168,230,213,0.12)', border: '1px solid rgba(168,230,213,0.35)',
                  borderRadius: '8px', padding: '0.4rem 0.875rem',
                  color: '#8FD9C4', fontSize: '0.8rem', fontWeight: 600,
                }}>
                  <i className={b.icon} />{b.label}
                </div>
              ))}
            </div>
          </div>
        </AnimCard>

        {/* Stats row */}
        <AnimCard direction="up" delay={100}>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1.25rem', maxWidth: '800px', margin: '0 auto 4rem',
          }}>
            {stats.map((s, i) => (
              <div key={i} className="why-stat-card" style={{
                background: i % 2 === 0
                  ? 'linear-gradient(135deg, #4A3F5E, #9B6BB4)'
                  : 'linear-gradient(135deg, #A8E6D5, #8FD9C4)',
                boxShadow: i % 2 === 0
                  ? '0 8px 28px rgba(155,107,180,0.30)'
                  : '0 8px 28px rgba(168,230,213,0.30)',
              }}>
                <div style={{
                  fontFamily: 'Playfair Display, serif', fontSize: '2rem', fontWeight: 800,
                  color: i % 2 === 0 ? '#A8E6D5' : '#4A3F5E', marginBottom: '0.25rem',
                }}>{s.value}</div>
                <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </AnimCard>

        {/* Core strengths */}
        <AnimCard delay={150}>
          <h3 style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 'clamp(1.4rem, 3vw, 2rem)',
            color: '#4A3F5E', fontWeight: 700, textAlign: 'center', marginBottom: '2rem',
          }}>Our Core Strengths</h3>
        </AnimCard>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
          {reasons.map((r, i) => (
            <AnimCard key={i} delay={i * 80}>
              <div className="why-reason-card">
                <div style={{
                  width: '64px', height: '64px', borderRadius: '18px',
                  background: `${r.color}14`,
                  border: `1px solid ${r.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                }}>
                  <i className={r.icon} style={{ fontSize: '1.5rem', color: r.color }} />
                </div>
                <h4 style={{
                  fontFamily: 'Playfair Display, serif', fontWeight: 700,
                  color: '#4A3F5E', fontSize: '1.05rem', marginBottom: '0.625rem',
                }}>{r.title}</h4>
                <p style={{ fontSize: '0.875rem', color: '#6B7A6C', lineHeight: 1.7 }}>{r.desc}</p>
              </div>
            </AnimCard>
          ))}
        </div>
      </div>
    </section>
  );
}
