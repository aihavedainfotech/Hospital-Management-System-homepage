import { useEffect, useRef, useState } from 'react';
import heroDoctorImg from '../assets/hero_doctor.png';

const stats = [
  { value: 355000, label: 'Patients Served', suffix: '+', icon: 'fas fa-users' },
  { value: 98, label: 'Satisfaction Rate', suffix: '%', icon: 'fas fa-heart' },
  { value: 120, label: 'Expert Doctors', suffix: '+', icon: 'fas fa-user-md' },
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
      minHeight: '85vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #DFF5F2 0%, #EAF4FF 100%)',
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
          box-shadow: 0 8px 24px rgba(31,45,61,0.08);
          z-index: 10;
        }

        .hero-floating-icon.icon-1 {
          width: 56px; height: 56px;
          top: 15%; left: 0%;
          color: #2EA3F2; font-size: 1.5rem;
          animation: float1 6s ease-in-out infinite;
        }

        .hero-floating-icon.icon-2 {
          width: 48px; height: 48px;
          bottom: 25%; left: -5%;
          color: #2BBF9C; font-size: 1.25rem;
          animation: float2 5s ease-in-out infinite;
        }

        .hero-floating-icon.icon-3 {
          width: 64px; height: 64px;
          top: 30%; right: -5%;
          color: #F5A623; font-size: 1.75rem;
          animation: float3 7s ease-in-out infinite;
        }

        /* Circular Glow Behind Image */
        .hero-circular-glow {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 500px; height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, #2BBF9C 0%, #2EA3F2 100%);
          opacity: 0.15;
          filter: blur(60px);
          z-index: 0;
        }

        /* Stat bar */
        .hero-stat-bar {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1.5rem;
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(16px);
          border-radius: 20px;
          padding: 1.5rem 2rem;
          border: 1px solid rgba(230,238,245,0.8);
          box-shadow: 0 12px 32px rgba(31,45,61,0.06);
          margin-top: 3rem;
        }
        .hero-stat-item {
          display: flex; align-items: center; gap: 1rem;
        }
        .hero-stat-icon {
          width: 48px; height: 48px; border-radius: 12px; flex-shrink: 0;
          background: rgba(46,163,242,0.1);
          border: 1px solid rgba(46,163,242,0.2);
          display: flex; align-items: center; justify-content: center;
        }
        .hero-stat-num {
          font-family: 'Poppins', sans-serif;
          font-size: 1.5rem; font-weight: 700; color: #1F2D3D; line-height: 1;
        }
        .hero-stat-label {
          font-size: 0.8rem; color: #6B7C93;
          margin-top: 0.2rem; font-weight: 500;
        }

        .hero-layout {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 4rem;
          padding: 4rem 0;
        }

        .hero-content {
          flex: 1;
          max-width: 600px;
          z-index: 2;
        }

        .hero-image-wrapper {
          flex: 1;
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1;
        }

        .hero-image {
          max-width: 100%;
          height: auto;
          border-radius: 24px;
          z-index: 2;
          position: relative;
          box-shadow: 0 20px 50px rgba(31,45,61,0.15);
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
              color: '#1F2D3D',
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: '1.25rem',
            }}>
              We Are Committed To <br/>
              <span style={{ color: '#2EA3F2' }}>Your Health.</span>
            </h1>

            <p style={{
              color: '#6B7C93', fontSize: '1.05rem', lineHeight: 1.7,
              marginBottom: '2.5rem', fontWeight: 400,
            }}>
              Experience modern, compassionate healthcare. Our state-of-the-art facilities and expert medical team are here to provide the premium care you deserve, right when you need it most.
            </p>

            <div className="hero-btn-group" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button className="btn-primary" onClick={onBook} style={{ padding: '0.875rem 2rem', fontSize: '1rem' }}>
                Book Appointment
              </button>
              <button className="btn-secondary" onClick={onDoctors} style={{ padding: '0.875rem 2rem', fontSize: '1rem' }}>
                Consult a Doctor
              </button>
            </div>
          </div>

          <div className="hero-image-wrapper">
            <div className="hero-circular-glow"></div>
            
            <div className="hero-floating-icon icon-1">
              <i className="fas fa-heartbeat"></i>
            </div>
            <div className="hero-floating-icon icon-2">
              <i className="fas fa-stethoscope"></i>
            </div>
            <div className="hero-floating-icon icon-3">
              <i className="fas fa-plus"></i>
            </div>

            <img src={heroDoctorImg} alt="Friendly Doctor" className="hero-image" />
          </div>
        </div>

        {/* Stats bar */}
        <div className="hero-stat-bar">
          {stats.map(stat => (
            <div key={stat.label} className="hero-stat-item">
              <div className="hero-stat-icon">
                <i className={stat.icon} style={{ fontSize: '1.2rem', color: '#2EA3F2' }} />
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
