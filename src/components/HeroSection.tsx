import { useEffect, useRef, useState } from 'react';
import heroImg from '../assets/new_hero.png';

const stats = [
  { value: 355000, label: 'Patients Served', suffix: '+', icon: 'fas fa-users' },
  { value: 98, label: 'Satisfaction Rate', suffix: '%', icon: 'fas fa-heart' },
  { value: 120, label: 'Expert Doctors', suffix: '+', icon: 'fas fa-user-md' },
  { value: 24, label: 'Emergency Support', suffix: '/7', icon: 'fas fa-clock' },
  { value: 15, label: 'Years of Excellence', suffix: '+', icon: 'fas fa-award' },
];


function Counter({ target, suffix, duration = 2000 }: { target: number; suffix: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const startTime = performance.now();
        const animate = (now: number) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);
          setCount(Math.floor(ease * target));
          if (progress < 1) requestAnimationFrame(animate);
          else setCount(target);
        };
        requestAnimationFrame(animate);
      }
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  // Format large numbers
  const formattedCount = target >= 1000 ? (count / 1000).toFixed(count >= 1000 && count < 10000 ? 1 : 0) + 'k' : count;

  return <span ref={ref}>{formattedCount}{suffix}</span>;
}

interface HeroProps {
  onBook: () => void;
  onDoctors: () => void;
}

export default function HeroSection({ onBook, onDoctors }: HeroProps) {
  return (
    <section id="home" style={{
      paddingTop: '80px',
      position: 'relative',
      overflow: 'hidden',
      minHeight: '72vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #DFF7F4 0%, var(--bg-primary) 100%)',
    }}>
      <style>{`
        /* Floating animations for icons */
        @keyframes float1 {
          0% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(5deg); }
          100% { transform: translateY(0) rotate(0deg); }
        }
        @keyframes float2 {
          0% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(15px) rotate(-5deg); }
          100% { transform: translateY(0) rotate(0deg); }
        }
        @keyframes float3 {
          0% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-10px) scale(1.05); }
          100% { transform: translateY(0) scale(1); }
        }

        .hero-floating-icon {
          position: absolute;
          background: rgba(255,255,255,0.8);
          backdrop-filter: blur(8px);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 8px 24px rgba(15,45,82,0.08);
          z-index: 10;
        }

        .hero-floating-icon.icon-1 {
          width: 56px; height: 56px;
          top: 15%; left: 0%;
          color: #14B8A6; font-size: 1.5rem;
          animation: float1 6s ease-in-out infinite;
        }

        .hero-floating-icon.icon-2 {
          width: 48px; height: 48px;
          bottom: 25%; left: -5%;
          color: #06B6D4; font-size: 1.25rem;
          animation: float2 5s ease-in-out infinite;
        }

        .hero-floating-icon.icon-3 {
          width: 64px; height: 64px;
          top: 30%; right: -5%;
          color: #0F766E; font-size: 1.75rem;
          animation: float3 7s ease-in-out infinite;
        }

        /* Circular Glow Behind Image */
        .hero-circular-glow {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 120%; height: 120%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(6,182,212,0.15) 0%, rgba(20,184,166,0.05) 100%);
          filter: blur(60px);
          z-index: 0;
        }

        .hero-stat-bar {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1.5rem;
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(16px);
          border-radius: 20px;
          padding: 1.5rem 2rem;
          border: 1px solid rgba(226,232,240,0.8);
          box-shadow: 0 12px 32px rgba(15,45,82,0.06);
          margin-top: 0.5rem;
          transform: translateY(-20px);
        }
        .hero-stat-item {
          display: flex; align-items: center; gap: 1rem;
        }
        .hero-stat-icon {
          width: 48px; height: 48px; border-radius: 12px; flex-shrink: 0;
          background: rgba(20,184,166,0.1);
          border: 1px solid rgba(20,184,166,0.2);
          display: flex; align-items: center; justify-content: center;
        }
        .hero-stat-num {
          font-family: 'Poppins', sans-serif;
          font-size: 1.5rem; font-weight: 700; color: #0F2D52; line-height: 1;
        }
        .hero-stat-label {
          font-size: 0.8rem; color: #64748B;
          margin-top: 0.2rem; font-weight: 500;
        }

        .hero-layout {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 4rem;
          padding: 3.5rem 0 1rem;
        }

        .hero-content {
          flex: 1;
          max-width: 550px;
          z-index: 2;
        }

        .hero-image-wrapper {
          flex: 1.4;
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1;
          cursor: pointer;
        }

        /* Pulsing outer ring */
        .hero-image-wrapper::before {
          content: '';
          position: absolute;
          inset: -10px;
          border-radius: 38px;
          border: 2px solid rgba(20,184,166,0);
          transition: border-color 0.4s ease, inset 0.4s ease;
          z-index: 0;
          pointer-events: none;
        }
        .hero-image-wrapper:hover::before {
          border-color: rgba(20,184,166,0.45);
          inset: -14px;
          animation: hero-ring-pulse 2s ease-in-out infinite;
        }
        @keyframes hero-ring-pulse {
          0%, 100% { border-color: rgba(20,184,166,0.45); }
          50%       { border-color: rgba(6,182,212,0.7); }
        }

        /* Shimmer overlay */
        .hero-image-wrapper::after {
          content: '';
          position: absolute;
          inset: 8px;
          border-radius: 24px;
          background: linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%);
          background-size: 200% 100%;
          background-position: 200% 0;
          z-index: 10;
          pointer-events: none;
          transition: background-position 0s;
        }
        .hero-image-wrapper:hover::after {
          animation: hero-shimmer 0.8s ease forwards;
        }
        @keyframes hero-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .hero-image {
          width: 100%;
          height: auto;
          border-radius: 30px;
          z-index: 2;
          position: relative;
          box-shadow: 0 30px 60px rgba(15,45,82,0.2);
          border: 8px solid white;
          object-fit: cover;
          transition: transform 0.45s cubic-bezier(0.34,1.56,0.64,1),
                      box-shadow 0.45s ease,
                      border-color 0.35s ease;
        }
        .hero-image-wrapper:hover .hero-image {
          transform: translateY(-10px) scale(1.025);
          box-shadow: 0 40px 80px rgba(15,45,82,0.28), 0 0 0 4px rgba(20,184,166,0.25);
          border-color: rgba(20,184,166,0.6);
        }

        /* Floating badge top-left */
        .hero-img-badge-tl {
          position: absolute; top: 18px; left: 18px; z-index: 20;
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(10px);
          border-radius: 14px; padding: 8px 14px;
          display: flex; align-items: center; gap: 8px;
          box-shadow: 0 8px 24px rgba(15,45,82,0.14);
          border: 1px solid rgba(20,184,166,0.2);
          opacity: 0; transform: translate(-8px,-8px) scale(0.9);
          transition: opacity 0.35s ease 0.05s, transform 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.05s;
          pointer-events: none;
        }
        .hero-img-badge-br {
          position: absolute; bottom: 24px; right: 18px; z-index: 20;
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(10px);
          border-radius: 14px; padding: 8px 14px;
          display: flex; align-items: center; gap: 8px;
          box-shadow: 0 8px 24px rgba(15,45,82,0.14);
          border: 1px solid rgba(20,184,166,0.2);
          opacity: 0; transform: translate(8px,8px) scale(0.9);
          transition: opacity 0.35s ease 0.12s, transform 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.12s;
          pointer-events: none;
        }
        .hero-image-wrapper:hover .hero-img-badge-tl,
        .hero-image-wrapper:hover .hero-img-badge-br {
          opacity: 1; transform: translate(0,0) scale(1);
        }
        .hero-badge-icon {
          width: 32px; height: 32px; border-radius: 9px;
          background: linear-gradient(135deg,#14B8A6,#0F766E);
          display: flex; align-items: center; justify-content: center;
          color: white; font-size: 0.85rem; flex-shrink: 0;
        }
        .hero-badge-num  { font-size: 1rem; font-weight: 700; color: #0F2D52; line-height: 1; }
        .hero-badge-lbl  { font-size: 0.65rem; color: #64748B; font-weight: 500; }

        /* ── Tablet ── */
        @media (max-width: 992px) {
          .hero-layout {
            flex-direction: column;
            text-align: center;
            padding: 2rem 0 0.5rem;
            gap: 2rem;
          }
          .hero-content {
            margin: 0 auto;
            align-items: center;
            max-width: 100%;
          }
          .hero-btn-group {
            justify-content: center;
          }
          .hero-image-wrapper {
            width: 100%;
            max-width: 520px;
            margin: 0 auto;
          }
        }

        /* ── Mobile ── */
        @media (max-width: 576px) {
          .hero-layout {
            padding: 1.5rem 0 0.5rem;
            gap: 1.2rem;
          }
          .hero-content {
            text-align: center;
          }
          /* Hero heading responsive */
          .hero-content h1 {
            font-size: clamp(1.8rem, 7vw, 2.4rem) !important;
            margin-bottom: 0.8rem !important;
          }
          /* Hero paragraph shorter on mobile */
          .hero-content p {
            font-size: 0.88rem !important;
            line-height: 1.6 !important;
            margin-bottom: 1.4rem !important;
          }
          /* Buttons full-width stacked */
          .hero-btn-group {
            flex-direction: column;
            gap: 0.6rem !important;
            align-items: stretch;
          }
          .hero-btn-group button {
            justify-content: center;
            padding: 0.75rem 1rem !important;
            font-size: 0.9rem !important;
          }
          /* Image smaller & no clipping border on mobile */
          .hero-image {
            border-radius: 20px !important;
            border-width: 5px !important;
          }
          .hero-image-wrapper {
            max-width: 340px;
          }
          /* Hover badges hidden on mobile (touch) */
          .hero-img-badge-tl,
          .hero-img-badge-br { display: none; }
          /* Stat bar compact */
          .hero-stat-bar {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 0.6rem !important;
            padding: 0.9rem 0.75rem !important;
            border-radius: 14px !important;
            transform: none !important;
            margin-top: 0 !important;
          }
          .hero-stat-item { gap: 0.5rem !important; }
          .hero-stat-icon {
            width: 36px !important; height: 36px !important;
            border-radius: 9px !important;
          }
          .hero-stat-icon i { font-size: 0.9rem !important; }
          .hero-stat-num { font-size: 1.1rem !important; }
          .hero-stat-label { font-size: 0.65rem !important; }
          /* Page bottom padding so content isn't behind mobile bar */
          body { padding-bottom: 72px; }
        }
      `}</style>

      {/* Content */}
      <div className="container" style={{ position: 'relative', zIndex: 5, flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        <div className="hero-layout">
          <div className="hero-content">
            <h1 style={{
              fontFamily: 'Poppins, sans-serif',
              fontSize: 'clamp(2.5rem, 4vw, 3.5rem)',
              color: '#0F2D52',
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: '1.25rem',
            }}>
              Our Health, <br/>
              <span style={{ color: '#14B8A6' }}>Our Priority.</span>
            </h1>

            <p style={{
              color: '#64748B', fontSize: '1.05rem', lineHeight: 1.7,
              marginBottom: '2.5rem', fontWeight: 400,
            }}>
              At Haveda Hospital, we combine advanced technology with compassionate care to help you and your family live healthier, happier lives. Our experienced healthcare professionals are dedicated to delivering safe, trusted, and patient-centered medical services with excellence, innovation, and 24/7 support.
            </p>

            <div className="hero-btn-group" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button className="btn-primary" onClick={onBook} style={{ padding: '0.875rem 2rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🗓️ Book Appointment
              </button>
              <button className="btn-secondary" onClick={onDoctors} style={{ padding: '0.875rem 2rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🩺 Find a Doctor
              </button>
            </div>
          </div>

          <div className="hero-image-wrapper">
            <div className="hero-circular-glow"></div>
            <img src={heroImg} alt="Hospital Facility" className="hero-image" />

            {/* Top-left badge */}
            <div className="hero-img-badge-tl">
              <div className="hero-badge-icon"><i className="fas fa-user-md" /></div>
              <div>
                <div className="hero-badge-num">120+</div>
                <div className="hero-badge-lbl">Expert Doctors</div>
              </div>
            </div>

            {/* Bottom-right badge */}
            <div className="hero-img-badge-br">
              <div className="hero-badge-icon" style={{ background: 'linear-gradient(135deg,#06B6D4,#0284C7)' }}>
                <i className="fas fa-award" />
              </div>
              <div>
                <div className="hero-badge-num">15+ Yrs</div>
                <div className="hero-badge-lbl">of Excellence</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="hero-stat-bar">
          {stats.map(stat => (
            <div key={stat.label} className="hero-stat-item">
              <div className="hero-stat-icon">
                <i className={stat.icon} style={{ fontSize: '1.2rem', color: '#14B8A6' }} />
              </div>
              <div>
                <div className="hero-stat-num">
                  <Counter target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="hero-stat-label">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
