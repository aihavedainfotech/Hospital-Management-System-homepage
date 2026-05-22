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
  const [position, setPosition] = useState(0);
  const animRef = useRef<number>(0);
  const lastTime = useRef<number>(0);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Debug logging
  console.log('TestimonialsSection rendering, compliments count:', compliments.length);

  // Fetch compliments from database
  useEffect(() => {
    const loadCompliments = async () => {
      try {
        console.log('Fetching compliments from API...');
        const data = await fetchCompliments();
        console.log('API response:', data);
        if (Array.isArray(data) && data.length > 0) {
          console.log('Using API data, count:', data.length);
          setCompliments(data);
        } else {
          console.log('No API data, displaying empty state');
          setCompliments([]);
        }
      } catch (error) {
        console.error('Error fetching compliments:', error);
        console.log('Error fetching, displaying empty state');
        setCompliments([]);
      }
    };

    loadCompliments();
  }, []);

  useEffect(() => {
    const el = sectionRef.current; 
    if (!el) return;
    
    // Make the title visible immediately
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
    
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { 
        el.classList.add('visible'); 
        obs.unobserve(el); 
      }
    }, { threshold: 0.1 });
    obs.observe(el); 
    return () => obs.disconnect();
  }, []);

  // Auto-scroll animation
  useEffect(() => {
    if (isPaused || compliments.length === 0) { 
      cancelAnimationFrame(animRef.current); 
      return; 
    }
    
    const speed = 0.5; // Adjust scroll speed
    const cardWidth = 320; // Card width + gap
    const totalWidth = compliments.length * cardWidth;
    
    const animate = (time: number) => {
      if (lastTime.current) {
        const delta = time - lastTime.current;
        setPosition(p => {
          const newPos = p + speed * (delta / 16);
          return newPos >= totalWidth ? 0 : newPos;
        });
      }
      lastTime.current = time;
      animRef.current = requestAnimationFrame(animate);
    };
    
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [isPaused, compliments.length]);

  // Always render the section, even if no compliments
  const hasCompliments = compliments.length > 0;

  console.log('Rendering TestimonialsSection, hasCompliments:', hasCompliments, 'compliments:', compliments);

  return (
    <section className="section-pad" style={{
      background: 'linear-gradient(160deg, #F7FBFF 0%, #FFFFFF 50%, #F7FBFF 100%)',
      overflow: 'hidden', 
      position: 'relative',
      minHeight: '200px' // Ensure minimum height
    }}>
      <style>{`
        .compliment-blob {
          position: absolute; 
          border-radius: 50%; 
          pointer-events: none;
        }
        .compliment-blob-1 {
          top: -60px; 
          left: -60px; 
          width: 320px; 
          height: 320px;
          background: radial-gradient(circle, rgba(46,163,242,0.05) 0%, transparent 65%);
        }
        .compliment-blob-2 {
          bottom: -40px; 
          right: -40px; 
          width: 280px; 
          height: 280px;
          background: radial-gradient(circle, rgba(43,191,156,0.05) 0%, transparent 65%);
        }
        .compliment-card {
          background: #FFFFFF;
          backdrop-filter: blur(14px);
          border-radius: 16px; 
          padding: 1.5rem;
          border: 1px solid #E6EEF5;
          box-shadow: 0 4px 16px rgba(31, 45, 61, 0.05);
          flex-shrink: 0; 
          width: 300px; 
          position: relative;
          transition: all 0.3s ease;
          margin-right: 20px;
        }
        .compliment-card:hover {
          box-shadow: 0 12px 32px rgba(31, 45, 61, 0.08);
          border-color: #2EA3F2;
          transform: translateY(-4px);
        }
        .compliment-quote-icon {
          position: absolute; 
          bottom: 1rem; 
          right: 1rem;
          font-size: 1.2rem; 
          color: rgba(46,163,242,0.15);
        }
        .compliment-name {
          font-weight: 600;
          color: #1F2D3D;
          font-size: 1rem;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .compliment-feedback {
          font-size: 0.875rem;
          color: #6B7C93;
          line-height: 1.6;
          font-style: italic;
          margin-bottom: 0.5rem;
        }
        .compliment-stars {
          display: flex;
          gap: 2px;
          margin-top: 0.75rem;
        }
        .compliment-star {
          font-size: 0.75rem;
          color: #FFD700;
        }
      `}</style>

      <div className="compliment-blob compliment-blob-1" />
      <div className="compliment-blob compliment-blob-2" />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div ref={sectionRef} style={{ 
          marginBottom: '2rem',
          opacity: 1,
          transform: 'translateY(0)',
          transition: 'all 0.6s ease'
        }}>
          <h2 style={{ 
            color: '#1F2D3D', 
            textAlign: 'center',
            fontSize: '2.5rem',
            fontWeight: '700',
            marginBottom: '1rem',
            fontFamily: 'Playfair Display, serif',
            position: 'relative',
            zIndex: 10,
            display: 'block !important' as any,
            visibility: 'visible !important' as any
          }}>
            What Our Patients Say
          </h2>
          <div style={{ 
            margin: '12px auto 16px', 
            background: '#2EA3F2', 
            width: '60px', 
            height: '4px', 
            borderRadius: '2px',
            display: 'block'
          }} />
          <p style={{ 
            color: '#6B7C93', 
            textAlign: 'center', 
            maxWidth: '600px', 
            margin: '0 auto 2rem',
            fontSize: '1.1rem',
            lineHeight: '1.6'
          }}>
            Real feedback from our valued patients who trusted us with their health.
          </p>
        </div>
      </div>

      <div
        style={{ 
          overflow: 'hidden', 
          position: 'relative', 
          paddingBottom: '1rem', 
          paddingTop: '0.5rem' 
        }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => { 
          setIsPaused(false); 
          lastTime.current = 0; 
        }}
      >
        {hasCompliments ? (
          <>
            <div style={{ 
              display: 'flex', 
              transform: `translateX(-${position}px)`, 
              willChange: 'transform', 
              padding: '0.5rem 0' 
            }}>
              {/* Duplicate the array for seamless loop */}
              {[...compliments, ...compliments, ...compliments].map((compliment, i) => (
                <div key={`${compliment.id}-${i}`} className="compliment-card">
                  <div className="compliment-name">
                    <i className="fas fa-user-circle" style={{ color: '#2EA3F2', fontSize: '1.2rem' }}></i>
                    {compliment.name}
                  </div>
                  
                  <div className="compliment-feedback">
                    "{compliment.feedback}"
                  </div>
                  
                  <div className="compliment-stars">
                    {[1, 2, 3, 4, 5].map(star => (
                      <i key={star} className="fas fa-star compliment-star"></i>
                    ))}
                  </div>
                  
                  <i className="fas fa-quote-right compliment-quote-icon" />
                </div>
              ))}
            </div>
            
            {/* Gradient edges for smooth fade effect */}
            <div style={{ 
              position: 'absolute', 
              left: 0, 
              top: 0, 
              bottom: 0, 
              width: '80px', 
              background: 'linear-gradient(to right, #F7FBFF, transparent)', 
              pointerEvents: 'none', 
              zIndex: 1 
            }} />
            <div style={{ 
              position: 'absolute', 
              right: 0, 
              top: 0, 
              bottom: 0, 
              width: '80px', 
              background: 'linear-gradient(to left, #F7FBFF, transparent)', 
              pointerEvents: 'none', 
              zIndex: 1 
            }} />
          </>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '3rem 2rem',
            color: '#6B7C93',
            fontSize: '1.1rem',
            fontStyle: 'italic'
          }}>
            <i className="fas fa-heart" style={{ fontSize: '2rem', color: '#2EA3F2', marginBottom: '1rem', display: 'block' }}></i>
            We'd love to hear from you! Share your experience with us.
            <div style={{ marginTop: '1rem' }}>
              <button 
                style={{
                  background: '#2EA3F2',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => (e.target as HTMLButtonElement).style.background = '#1e8bc3'}
                onMouseOut={(e) => (e.target as HTMLButtonElement).style.background = '#2EA3F2'}
                onClick={() => {
                  // Scroll to feedback section or open feedback modal
                  const feedbackSection = document.querySelector('[data-section="feedback"]');
                  if (feedbackSection) {
                    feedbackSection.scrollIntoView({ behavior: 'smooth' });
                  }
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
