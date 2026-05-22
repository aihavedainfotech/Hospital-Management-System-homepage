import { useEffect, useRef, useState } from 'react';
import { fetchTicker } from '../api';
import logo from '../assets/logo_transparent.png';

export function MarqueeTicker() {
  const [tickerItems, setTickerItems] = useState<{icon: string, text: string}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTickerData = async () => {
      try {
        const data = await fetchTicker();
        setTickerItems(data);
      } catch (error) {
        console.error('Error fetching ticker data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadTickerData();
  }, []);

  if (loading || tickerItems.length === 0) return null;

  const doubled = [...tickerItems, ...tickerItems];
  return (
    <div className="marquee-wrapper" style={{ background: '#2EA3F2', height: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', height: '100%', overflow: 'hidden' }}>
        <div style={{ background: '#2BBF9C', color: 'white', padding: '0 1.5rem', height: '100%', display: 'flex', alignItems: 'center', fontWeight: 700, fontSize: '0.8rem', zIndex: 2, flexShrink: 0 }}>
          LATEST NEWS
        </div>
        <div className="marquee-inner" style={{ display: 'flex', gap: '3rem' }}>
          {doubled.map((item, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', whiteSpace: 'nowrap', color: 'white' }}>
              <i className={item.icon} style={{ color: 'white', opacity: 0.8 }}></i>
              {item.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function HealthTipsSection() {
  const tips = [
    { icon: 'fas fa-heart-pulse', title: 'Heart Health Tips', excerpt: 'Learn the essential habits to keep your heart strong and healthy every day.', category: 'Cardiology', color: '#EF4444' },
    { icon: 'fas fa-stethoscope', title: 'Regular Checkups', excerpt: 'Why preventive screenings are the key to long-term wellness and early detection.', category: 'Checkup', color: '#2EA3F2' },
    { icon: 'fas fa-apple-alt', title: 'Nutrition Guide', excerpt: 'Expert advice on building a balanced diet for sustained energy and vitality.', category: 'Nutrition', color: '#2BBF9C' },
  ];

  return (
    <section className="section-pad" style={{ background: '#F7FBFF', borderTop: '1px solid #E6EEF5' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 className="section-title" style={{ color: '#1F2D3D' }}>Health Tips</h2>
          <div className="section-divider" style={{ margin: '12px auto 16px', background: '#2EA3F2', width: '60px', height: '4px', borderRadius: '2px' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {tips.map((tip, i) => (
            <div key={i} style={{
              background: '#FFFFFF', border: '1px solid #E6EEF5', borderRadius: '16px', padding: '2rem',
              boxShadow: '0 4px 12px rgba(31, 45, 61, 0.05)', transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.borderColor = '#2EA3F2'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.borderColor = '#E6EEF5'; }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: `${tip.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <i className={tip.icon} style={{ fontSize: '1.2rem', color: tip.color }}></i>
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1F2D3D', marginBottom: '8px' }}>{tip.title}</h3>
              <p style={{ fontSize: '0.9rem', color: '#6B7C93', lineHeight: 1.6, marginBottom: '1rem' }}>{tip.excerpt}</p>
              <span style={{ color: '#2EA3F2', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>Learn More →</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function BackToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);
  return visible ? (
    <button className="back-to-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ background: '#2EA3F2', color: 'white', border: 'none', width: '40px', height: '40px', borderRadius: '8px', cursor: 'pointer', position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 100, boxShadow: '0 4px 12px rgba(46,163,242,0.3)' }}>
      <i className="fas fa-chevron-up"></i>
    </button>
  ) : null;
}

export function ProgressBar() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const handler = () => {
      const doc = document.documentElement;
      const totalHeight = doc.scrollHeight - doc.clientHeight;
      setProgress(totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0);
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);
  return <div style={{ position: 'fixed', top: 0, left: 0, height: '3px', background: '#2EA3F2', width: `${progress}%`, zIndex: 9999, transition: 'width 0.1s ease' }}></div>;
}

export default function Footer({ onBook, onPortal }: { onBook: () => void; onPortal: () => void }) {
  const links = [
    { name: 'Home', target: 'home' },
    { name: 'About Us', target: 'about' },
    { name: 'Doctors', target: 'doctors' },
    { name: 'Departments', target: 'services' },
    { name: 'Services', target: 'services' },
    { name: 'Patient Portal', action: onPortal },
    { name: 'Contact', target: 'contact' },
  ];

  const handleLinkClick = (link: any) => {
    if (link.action) {
      link.action();
    } else if (link.target) {
      const el = document.getElementById(link.target);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <footer id="contact" style={{ paddingTop: '4rem', background: '#1F2D3D', color: 'white' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '3rem', paddingBottom: '3rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
              <img src={logo} alt="Logo" style={{ height: '32px' }} />
              <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>Haveda Hospital</span>
            </div>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem' }}>
              Providing world-class healthcare with excellence and compassion. Your health is our priority.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              {['facebook-f', 'twitter', 'instagram', 'linkedin-in'].map((icon, i) => (
                <div key={i} style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.8)', cursor: 'pointer' }}>
                  <i className={`fab fa-${icon}`}></i>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Quick Links</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {links.map(link => (
                <li key={link.name} style={{ marginBottom: '10px' }}>
                  <span 
                    onClick={() => handleLinkClick(link)}
                    style={{ 
                      fontSize: '0.9rem', 
                      color: 'rgba(255,255,255,0.6)', 
                      cursor: 'pointer',
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#2EA3F2')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                  >
                    {link.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Contact Info</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <i className="fas fa-map-marker-alt" style={{ color: '#2EA3F2', marginTop: '4px' }}></i>
                <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>123 Health Ave, Hyderabad</span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <i className="fas fa-phone" style={{ color: '#2EA3F2' }}></i>
                <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>+91 99999 99999</span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <i className="fas fa-envelope" style={{ color: '#2EA3F2' }}></i>
                <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>care@haveda.com</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '1.5rem 0', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
          <span>© 2024 Haveda Hospital. All rights reserved.</span>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
