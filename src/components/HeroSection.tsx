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
      background: 'linear-gradient(135deg, #DFF7F4 0%, #F8FFFE 100%)',
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
        }

        /* Responsive */
        @media (max-width: 992px) {
          .hero-layout {
            flex-direction: column;
            text-align: center;
          }
          .hero-content {
            margin: 0 auto;
            align-items: center;
          }
          .hero-btn-group {
            justify-content: center;
          }
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
