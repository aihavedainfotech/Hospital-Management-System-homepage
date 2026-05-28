import { useState, useEffect, useRef } from 'react';
import { fetchCompliments } from '../api';

interface Compliment {
  id: number | string;
  name: string;
  feedback: string;
  created_at?: string;
  rating?: number;
}

export default function TestimonialsSection() {
  const [compliments, setCompliments] = useState<Compliment[]>([]);
  const [isPaused, setIsPaused] = useState(false);

  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const positionRef = useRef(0);
  const lastTimeRef = useRef(0);
  const isPausedRef = useRef(false);
  const complimentsLenRef = useRef(0);

  // Fetch compliments from database — runs once on mount
  useEffect(() => {
    fetchCompliments()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCompliments(data);
          complimentsLenRef.current = data.length;
        }
      })
      .catch(() => {/* silently use empty state */});
  }, []);

  // Intersection observer for fade-in
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add('visible'); obs.unobserve(el); }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Keep isPausedRef in sync WITHOUT triggering animation effect
  useEffect(() => {
    isPausedRef.current = isPaused;
    if (!isPaused) lastTimeRef.current = 0; // reset delta on resume
  }, [isPaused]);

  // Animation loop — updates DOM directly via ref, NO state updates = NO re-renders
  useEffect(() => {
    if (compliments.length === 0) return;

    const speed = 0.5;
    const isMobile = window.innerWidth <= 768;
    const cardWidth = isMobile ? 260 : 320; // mobile: 240px + 20px margin, desktop: 300px + 20px margin
    const totalWidth = compliments.length * cardWidth;

    const animate = (time: number) => {
      if (!isPausedRef.current) {
        if (lastTimeRef.current) {
          const delta = time - lastTimeRef.current;
          positionRef.current += speed * (delta / 16);
          if (positionRef.current >= totalWidth) {
            positionRef.current = 0;
          }
          if (trackRef.current) {
            trackRef.current.style.transform = `translateX(-${positionRef.current}px)`;
          }
        }
        lastTimeRef.current = time;
      }
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [compliments.length]); // only re-run if data changes

  const hasCompliments = compliments.length > 0;

  return (
    <section className="section-pad" style={{
      background: 'var(--bg-section)',
      overflow: 'hidden',
      position: 'relative',
      minHeight: '200px'
    }}>
      <style>{`
        .compliment-blob {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }
        .compliment-blob-1 {
          top: -60px; left: -60px; width: 320px; height: 320px;
          background: radial-gradient(circle, rgba(20, 184, 166,0.05) 0%, transparent 65%);
        }
        .compliment-blob-2 {
          bottom: -40px; right: -40px; width: 280px; height: 280px;
          background: radial-gradient(circle, rgba(43,191,156,0.05) 0%, transparent 65%);
        }
        .compliment-card {
          background: #FFFFFF;
          backdrop-filter: blur(14px);
          border-radius: 16px;
          padding: 1.5rem;
          border: 1px solid rgba(15, 45, 82, 0.12);
          box-shadow: 0 10px 30px rgba(15, 45, 82, 0.1);
          flex-shrink: 0;
          width: 300px;
          position: relative;
          transition: all 0.3s ease;
          margin-right: 20px;
        }
        .compliment-card:hover {
          box-shadow: 0 16px 40px rgba(20, 184, 166, 0.22);
          border-color: rgba(20, 184, 166, 0.35);
          transform: translateY(-4px);
        }
        .compliment-quote-icon {
          position: absolute; bottom: 1rem; right: 1rem;
          font-size: 1.2rem; color: rgba(20, 184, 166,0.15);
        }
        .compliment-name {
          font-weight: 600; color: #0F2D52; font-size: 1rem;
          margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;
        }
        .compliment-feedback {
          font-size: 0.875rem; color: #64748B; line-height: 1.6;
          font-style: italic; margin-bottom: 0.5rem;
        }
        .compliment-stars { display: flex; gap: 2px; margin-top: 0.75rem; }
        .compliment-star { font-size: 0.75rem; color: #FFD700; }

        @media (max-width: 768px) {
          .compliment-card {
            width: 240px;
            padding: 1.25rem;
          }
          .compliment-name {
            font-size: 0.9rem;
          }
          .compliment-feedback {
            font-size: 0.8rem;
          }
        }
      `}</style>

      <div className="compliment-blob compliment-blob-1" />
      <div className="compliment-blob compliment-blob-2" />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div ref={sectionRef} style={{
          marginBottom: '2rem', opacity: 1, transform: 'translateY(0)', transition: 'all 0.6s ease'
        }}>
          <h2 style={{
            color: '#0F2D52', textAlign: 'center', fontSize: '2.5rem', fontWeight: '700',
            marginBottom: '1rem', fontFamily: 'Playfair Display, serif', position: 'relative', zIndex: 10
          }}>
            What Our Patients Say
          </h2>
          <div style={{
            margin: '12px auto 16px', background: '#14B8A6',
            width: '60px', height: '4px', borderRadius: '2px', display: 'block'
          }} />
          <p style={{
            color: '#64748B', textAlign: 'center', maxWidth: '600px',
            margin: '0 auto 2rem', fontSize: '1.1rem', lineHeight: '1.6'
          }}>
            Real feedback from our valued patients who trusted us with their health.
          </p>
        </div>
      </div>

      <div
        style={{ overflow: 'hidden', position: 'relative', paddingBottom: '1rem', paddingTop: '0.5rem' }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {hasCompliments ? (
          <>
            {/* trackRef — position updated directly, no React state */}
            <div ref={trackRef} style={{
              display: 'flex',
              willChange: 'transform',
              padding: '0.5rem 0'
            }}>
              {/* Triple the array for seamless infinite loop */}
              {[...compliments, ...compliments, ...compliments].map((compliment, i) => (
                <div key={`${compliment.id}-${i}`} className="compliment-card">
                  <div className="compliment-name">
                    <i className="fas fa-user-circle" style={{ color: '#14B8A6', fontSize: '1.2rem' }} />
                    {compliment.name}
                  </div>
                  <div className="compliment-feedback">
                    "{compliment.feedback}"
                  </div>
                  <div className="compliment-stars">
                    {[1, 2, 3, 4, 5].map(star => (
                      <i key={star} className="fas fa-star compliment-star" />
                    ))}
                  </div>
                  <i className="fas fa-quote-right compliment-quote-icon" />
                </div>
              ))}
            </div>

            {/* Gradient fade edges */}
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0, width: '80px',
              background: 'linear-gradient(to right, var(--bg-primary), transparent)',
              pointerEvents: 'none', zIndex: 1
            }} />
            <div style={{
              position: 'absolute', right: 0, top: 0, bottom: 0, width: '80px',
              background: 'linear-gradient(to left, var(--bg-primary), transparent)',
              pointerEvents: 'none', zIndex: 1
            }} />
          </>
        ) : (
          <div style={{
            textAlign: 'center', padding: '3rem 2rem',
            color: '#64748B', fontSize: '1.1rem', fontStyle: 'italic'
          }}>
            <i className="fas fa-heart" style={{ fontSize: '2rem', color: '#14B8A6', marginBottom: '1rem', display: 'block' }} />
            We'd love to hear from you! Share your experience with us.
            <div style={{ marginTop: '1rem' }}>
              <button
                style={{
                  background: '#14B8A6', color: 'white', border: 'none',
                  padding: '0.75rem 1.5rem', borderRadius: '8px',
                  fontSize: '1rem', cursor: 'pointer', transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => (e.target as HTMLButtonElement).style.background = '#1e8bc3'}
                onMouseOut={(e) => (e.target as HTMLButtonElement).style.background = '#14B8A6'}
                onClick={() => {
                  const feedbackSection = document.querySelector('[data-section="feedback"]');
                  if (feedbackSection) feedbackSection.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Share Your Feedback
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
