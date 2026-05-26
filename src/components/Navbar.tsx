import { useEffect, useRef, useState } from 'react';
import HospitalLogo from './HospitalLogo';

const navLinks = [
  { label: 'Home', href: '#home', icon: 'fas fa-home' },
  { label: 'Doctors', href: '#doctors', icon: 'fas fa-user-md' },
  { label: 'News', href: '#events', icon: 'fas fa-newspaper' },
  { label: 'Contact', href: '#contact', icon: 'fas fa-phone-alt' },
];


interface NavbarProps {
  onAppointmentClick?: () => void;
  onPortalClick?: () => void;
  onCancelClick?: () => void;
  onFeedbackClick?: () => void;
}

export default function Navbar({ onAppointmentClick, onPortalClick, onCancelClick, onFeedbackClick }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('#home');
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (href: string) => {
    setMenuOpen(false);
    setActiveLink(href);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <style>{`
        /* 
           NAVBAR - CLEAN, SOFT, PREMIUM HEALTHCARE
        */
        .hn-navbar {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 1000;
          height: 80px;
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.98);
          border-bottom: 1px solid transparent;
          transition: all 0.3s ease;
          font-family: 'Poppins', sans-serif;
        }

        .hn-navbar.scrolled {
          height: 70px;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(8px);
          border-bottom: 1px solid #E2E8F0;
          box-shadow: 0 4px 20px rgba(15, 45, 82, 0.04);
        }

        .hn-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 20px;
        }

        /* Logo */
        .hn-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          cursor: pointer;
        }
        
        .hn-logo-icon {
          color: #14B8A6;
          font-size: 1.8rem;
          display: flex;
          align-items: center;
        }

        .hn-logo-text {
          display: flex;
          flex-direction: column;
        }

        .hn-logo-name {
          font-size: 1.25rem;
          font-weight: 700;
          color: #0F2D52;
          letter-spacing: 0.5px;
          line-height: 1.1;
        }

        .hn-logo-sub {
          font-size: 0.65rem;
          font-weight: 500;
          color: #64748B;
          text-transform: uppercase;
          letter-spacing: 1.5px;
        }

        /* Nav Links */
        .hn-links {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .hn-link {
          text-decoration: none;
          font-size: 0.85rem;
          font-weight: 600;
          color: #64748B;
          cursor: pointer;
          transition: color 0.2s ease;
          position: relative;
          padding: 8px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .hn-link::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0;
          width: 100%;
          height: 2px;
          background: #14B8A6;
          transform: scaleX(0);
          transition: transform 0.2s ease;
          border-radius: 2px;
        }

        .hn-link:hover {
          color: #14B8A6;
        }

        .hn-link:hover::after, .hn-link.active::after {
          transform: scaleX(1);
        }

        .hn-link.active {
          color: #14B8A6;
        }

        /* Actions */
        .hn-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .btn-outline {
          background: transparent;
          border: 1px solid #E2E8F0;
          color: #0F2D52;
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .btn-outline:hover {
          border-color: #14B8A6;
          color: #14B8A6;
          background: #F8FFFE;
        }

        .btn-solid {
          background: #14B8A6;
          border: none;
          color: #FFFFFF;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 2px 8px rgba(20, 184, 166, 0.2);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .btn-solid:hover {
          background: #0F766E;
          box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);
        }

        /* Hamburger */
        .hn-hamburger {
          display: none;
          background: transparent;
          border: none;
          color: #0F2D52;
          font-size: 1.5rem;
          cursor: pointer;
        }

        /* Overlay */
        .hn-overlay {
          position: fixed; inset: 0;
          background: rgba(15, 45, 82, 0.4);
          backdrop-filter: blur(4px);
          z-index: 1998;
          opacity: 0; pointer-events: none;
          transition: opacity 0.3s ease;
        }
        .hn-overlay.open { opacity: 1; pointer-events: auto; }

        /* Mobile Sidebar */
        .hn-sidebar {
          position: fixed; top: 0; right: -320px;
          width: 300px; height: 100vh;
          background: #FFFFFF;
          box-shadow: -4px 0 24px rgba(15, 45, 82, 0.1);
          z-index: 1999;
          padding: 24px;
          transition: right 0.3s ease;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }
        .hn-sidebar.open { right: 0; }

        .hn-sb-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 32px;
        }
        
        .hn-sb-close {
          background: #F8FFFE;
          border: none;
          color: #64748B;
          width: 36px; height: 36px;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: background 0.2s;
        }
        .hn-sb-close:hover { background: #E2E8F0; color: #0F2D52; }

        .hn-sb-links {
          display: flex; flex-direction: column; gap: 8px;
          flex: 1;
        }

        .hn-sb-link {
          display: flex; align-items: center; gap: 12px;
          padding: 12px;
          border-radius: 8px;
          color: #64748B;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.2s ease;
          background: transparent;
          border: none;
          text-align: left;
          width: 100%;
          cursor: pointer;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .hn-sb-link:hover, .hn-sb-link.active {
          background: #F8FFFE;
          color: #14B8A6;
        }

        .hn-sb-actions {
          display: flex; flex-direction: column; gap: 12px;
          margin-top: 24px;
        }

        @media (max-width: 1200px) {
          .hn-links { display: none; }
          .hn-actions { display: none; }
          .hn-hamburger { display: block; }
        }
      `}</style>

      <nav className={`hn-navbar${scrolled ? ' scrolled' : ''}`}>
        <div className="hn-inner">
          
          {/* Logo */}
          <a href="#home" className="hn-logo" onClick={e => { e.preventDefault(); scrollTo('#home'); }}>
            <div className="hn-logo-icon">
              <HospitalLogo size={36} animated={false} variant="light" />
            </div>
            <div className="hn-logo-text">
              <span className="hn-logo-name">HAVEDA</span>
              <span className="hn-logo-sub">Healthcare</span>
            </div>
          </a>

          {/* Links */}
          <div className="hn-links">
            {navLinks.map(link => (
              <a key={link.href} href={link.href}
                className={`hn-link${activeLink === link.href ? ' active' : ''}`}
                onClick={e => { 
                  e.preventDefault(); 
                  if (link.label === 'Cancel/Reschedule') {
                    onCancelClick?.();
                  } else if (link.label === 'Feedback') {
                    onFeedbackClick?.();
                  } else {
                    scrollTo(link.href);
                  }
                }}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Actions */}
          <div className="hn-actions">
            <button className="btn-outline" onClick={onPortalClick}>
              <i className="fas fa-user-circle" /> Portal
            </button>

            <button className="btn-solid" onClick={onAppointmentClick}>
              Appointment Booking
            </button>
          </div>

          {/* Hamburger */}
          <button className="hn-hamburger" onClick={() => setMenuOpen(true)}>
            <i className="fas fa-bars" />
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`hn-overlay${menuOpen ? ' open' : ''}`} onClick={() => setMenuOpen(false)} />
      <div ref={sidebarRef} className={`hn-sidebar${menuOpen ? ' open' : ''}`}>
        
        <div className="hn-sb-header">
          <div className="hn-logo-text">
            <span className="hn-logo-name">HAVEDA</span>
          </div>
          <button className="hn-sb-close" onClick={() => setMenuOpen(false)}>
            <i className="fas fa-times" />
          </button>
        </div>

        <div className="hn-sb-links">
          {navLinks.map(link => (
            <button key={link.href}
              className={`hn-sb-link${activeLink === link.href ? ' active' : ''}`}
              onClick={() => {
                setMenuOpen(false);
                if (link.label === 'Cancel/Reschedule') {
                  onCancelClick?.();
                } else if (link.label === 'Feedback') {
                  onFeedbackClick?.();
                } else {
                  scrollTo(link.href);
                }
              }}
            >
              <i className={link.icon} style={{ width: '24px', textAlign: 'center' }} />
              {link.label}
            </button>
          ))}
        </div>

        <div className="hn-sb-actions">
          <button className="btn-outline" onClick={() => { setMenuOpen(false); onPortalClick?.(); }} style={{ width: '100%', justifyContent: 'center' }}>
            <i className="fas fa-user-circle" /> Patient Portal
          </button>

          <button className="btn-solid" onClick={() => { setMenuOpen(false); onAppointmentClick?.(); }} style={{ width: '100%', justifyContent: 'center' }}>
            Appointment Booking
          </button>
        </div>

      </div>
    </>
  );
}
